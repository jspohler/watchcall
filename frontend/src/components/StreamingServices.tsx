import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface StreamingServicesProps {
  onServicesChange: (services: string[]) => void;
}

const StreamingServices: React.FC<StreamingServicesProps> = ({ onServicesChange }) => {
  const [services, setServices] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch available services and user preferences only once when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [servicesResponse, preferencesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/services', {
            withCredentials: true
          }),
          axios.get('http://localhost:5000/api/user/services', {
            withCredentials: true
          })
        ]);

        setServices(servicesResponse.data);
        setSelectedServices(preferencesResponse.data);
        
        // Only call onServicesChange on initial mount
        if (isInitialMount.current) {
          onServicesChange(preferencesResponse.data);
          isInitialMount.current = false;
        }
      } catch (err) {
        console.error('Error fetching streaming services:', err);
        setError('Failed to load streaming services');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array - only run on mount

  const handleServiceToggle = async (service: string) => {
    const newSelectedServices = selectedServices.includes(service)
      ? selectedServices.filter(s => s !== service)
      : [...selectedServices, service];
    
    try {
      await axios.put(
        'http://localhost:5000/api/user/services',
        newSelectedServices,
        { withCredentials: true }
      );
      
      setSelectedServices(newSelectedServices);
      onServicesChange(newSelectedServices);
    } catch (err) {
      console.error('Error updating streaming services:', err);
      setError('Failed to update streaming services');
    }
  };

  return (
    <div className="streaming-services-container" ref={dropdownRef}>
      <button
        className="streaming-services-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Select your streaming services"
      >
        Streaming Services
        <span className="selected-count">
          {selectedServices.length > 0 ? ` (${selectedServices.length})` : ''}
        </span>
      </button>

      {isOpen && (
        <div className="streaming-services-dropdown">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {isLoading ? (
            <div className="loading-message">Loading...</div>
          ) : (
            <div className="services-list">
              {services.map((service) => (
                <label key={service} className="service-item">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                  />
                  <span className="service-name">{service}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StreamingServices; 