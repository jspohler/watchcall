from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from datetime import datetime
import time
import logging
import traceback
import shutil
import chromedriver_autoinstaller

from models import db, Movie, StreamingAvailability
from utils.email_notifier import notifier

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StreamingScraper:
    def __init__(self):
        logger.info("Initializing StreamingScraper...")
        try:
            # Install ChromeDriver if necessary
            chromedriver_autoinstaller.install()
            
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            
            # Find chromium-browser executable
            chromium_path = shutil.which('chromium-browser')
            if not chromium_path:
                raise Exception("Chromium browser not found")
            
            logger.info(f"Using Chromium at: {chromium_path}")
            chrome_options.binary_location = chromium_path
            
            logger.info("Setting up Chromium WebDriver...")
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 10)
            self.structure_error_reported = False
            logger.info("StreamingScraper initialized successfully")
        except Exception as e:
            error_msg = f"Failed to initialize StreamingScraper: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            notifier.send_scraping_failure_notification(error_msg)
            raise

    def __del__(self):
        if hasattr(self, 'driver'):
            try:
                self.driver.quit()
                logger.info("Chromium WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing Chromium WebDriver: {str(e)}")

    def search_movie(self, title, year=None):
        try:
            # Format the search URL
            search_query = f"{title} {year if year else ''}".strip()
            search_url = f"https://www.werstreamt.es/filme/?q={search_query}"
            
            logger.info(f"Searching for movie: {search_query}")
            self.driver.get(search_url)
            time.sleep(2)  # Wait for page to load

            # Find the first movie result
            try:
                movie_link = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'a.title'))
                )
                movie_url = movie_link.get_attribute('href')
                logger.info(f"Found movie URL: {movie_url}")
                return movie_url
            except TimeoutException:
                logger.warning(f"No results found for {search_query}")
                return None

        except WebDriverException as e:
            error_msg = f"WebDriver error searching for movie {title}: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            if not self.structure_error_reported:
                notifier.send_scraping_failure_notification(error_msg)
                self.structure_error_reported = True
            return None
        except Exception as e:
            error_msg = f"Error searching for movie {title}: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            if not self.structure_error_reported:
                notifier.send_scraping_failure_notification(error_msg)
                self.structure_error_reported = True
            return None

    def get_streaming_services(self, movie_url):
        if not movie_url:
            return []

        try:
            logger.info(f"Getting streaming services from: {movie_url}")
            self.driver.get(movie_url)
            time.sleep(2)  # Wait for page to load

            # Find streaming service elements
            streaming_services = []
            
            # Look for subscription streaming services
            try:
                logger.info("Looking for subscription section...")
                subscription_section = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, '.subscription'))
                )
                services = subscription_section.find_elements(By.CSS_SELECTOR, '.provider-item')
                
                logger.info(f"Found {len(services)} streaming services")
                for service in services:
                    name = service.get_attribute('title')
                    if name:
                        streaming_services.append({
                            'service': name,
                            'type': 'subscription'
                        })
                        logger.info(f"Found streaming service: {name}")
            except TimeoutException:
                logger.info("No subscription services found")
                pass  # No subscription services found

            return streaming_services

        except WebDriverException as e:
            error_msg = f"WebDriver error getting streaming services from {movie_url}: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            if not self.structure_error_reported:
                notifier.send_scraping_failure_notification(error_msg)
                self.structure_error_reported = True
            return []
        except Exception as e:
            error_msg = f"Error getting streaming services from {movie_url}: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            if not self.structure_error_reported:
                notifier.send_scraping_failure_notification(error_msg)
                self.structure_error_reported = True
            return []

    def update_movie_availability(self, movie):
        """Update streaming availability for a single movie"""
        logger.info(f"Updating streaming availability for {movie.title} ({movie.year})")
        
        try:
            # Search for the movie on werstreamt.es
            movie_url = self.search_movie(movie.title, movie.year)
            if not movie_url:
                logger.warning(f"Movie not found on werstreamt.es: {movie.title}")
                return

            # Get current streaming services
            streaming_services = self.get_streaming_services(movie_url)
            
            # Update database
            try:
                # Remove old entries
                old_count = StreamingAvailability.query.filter_by(movie_id=movie.imdb_id).delete()
                logger.info(f"Removed {old_count} old streaming entries")
                
                # Add new entries
                for service_info in streaming_services:
                    availability = StreamingAvailability(
                        movie_id=movie.imdb_id,
                        service=service_info['service'],
                        region='DE',  # Hardcoded for now
                        added_by_user_id=1  # System user ID
                    )
                    db.session.add(availability)
                
                db.session.commit()
                logger.info(f"Updated streaming services for {movie.title}: {[s['service'] for s in streaming_services]}")
                
            except Exception as e:
                db.session.rollback()
                error_msg = f"Database error updating {movie.title}: {str(e)}\n{traceback.format_exc()}"
                logger.error(error_msg)
                if not self.structure_error_reported:
                    notifier.send_scraping_failure_notification(error_msg)
                    self.structure_error_reported = True
                
        except Exception as e:
            error_msg = f"Error updating movie {movie.title}: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            if not self.structure_error_reported:
                notifier.send_scraping_failure_notification(error_msg)
                self.structure_error_reported = True

def update_all_movies():
    """Update streaming availability for all movies in the database"""
    logger.info("Starting update_all_movies()")
    try:
        scraper = StreamingScraper()
        movies = Movie.query.all()
        logger.info(f"Found {len(movies)} movies to update")
        
        for movie in movies:
            try:
                scraper.update_movie_availability(movie)
                time.sleep(2)  # Be nice to the website
            except Exception as e:
                error_msg = f"Error processing movie {movie.title}: {str(e)}\n{traceback.format_exc()}"
                logger.error(error_msg)
                if not scraper.structure_error_reported:
                    notifier.send_scraping_failure_notification(error_msg)
                    scraper.structure_error_reported = True
                continue
        
        logger.info("Finished updating all movies")
    except Exception as e:
        error_msg = f"Error in update_all_movies: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        notifier.send_scraping_failure_notification(error_msg)
    finally:
        if 'scraper' in locals():
            scraper.__del__() 