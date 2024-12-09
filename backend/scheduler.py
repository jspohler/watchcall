from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from scrapers.streaming_scraper import update_all_movies
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_scheduler():
    scheduler = BackgroundScheduler()
    
    # Schedule the update to run every day at 3 AM
    scheduler.add_job(
        update_all_movies,
        trigger=CronTrigger(hour=3, minute=0),
        id='update_streaming_availability',
        name='Update streaming availability for all movies',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started. Streaming availability will be updated daily at 3 AM.") 