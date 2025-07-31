import { Request, Response } from 'express';
import { LocationService } from '../services/LocationService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

export const getUserLocation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const location = await LocationService.getUserLocation(req.user.id);

  res.status(200).json({
    status: 'success',
    data: location,
  });
});

export const updateUserLocation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const { latitude, longitude, source, city, country } = req.body;

  if (!latitude || !longitude || !source) {
    throw new AppError('Latitude, longitude, and source are required', 400);
  }

  if (!['gps', 'manual', 'ip', 'search'].includes(source)) {
    throw new AppError('Invalid source. Must be gps, manual, ip, or search', 400);
  }

  const location = await LocationService.updateUserLocation(req.user.id, {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    source,
    city,
    country
  });

  res.status(200).json({
    status: 'success',
    data: location,
    message: 'Location updated successfully',
  });
});

export const getLocationFromIP = asyncHandler(async (req: Request, res: Response) => {
  const userIP = LocationService.getUserIP(req);
  const ipLocation = await LocationService.getLocationFromIP(userIP);

  res.status(200).json({
    status: 'success',
    data: ipLocation,
  });
});

export const setLocationFromIP = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const userIP = LocationService.getUserIP(req);
  const location = await LocationService.setLocationFromIP(req.user.id, userIP);

  res.status(200).json({
    status: 'success',
    data: location,
    message: 'Location set from IP address successfully',
  });
});

export const reverseGeocode = asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    throw new AppError('Latitude and longitude are required', 400);
  }

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);

  if (!LocationService.validateCoordinates(lat, lng)) {
    throw new AppError('Invalid coordinates', 400);
  }

  const locationData = await LocationService.reverseGeocode(lat, lng);

  res.status(200).json({
    status: 'success',
    data: locationData,
  });
});

export const calculateDistance = asyncHandler(async (req: Request, res: Response) => {
  const { lat1, lng1, lat2, lng2 } = req.query;

  if (!lat1 || !lng1 || !lat2 || !lng2) {
    throw new AppError('All coordinates (lat1, lng1, lat2, lng2) are required', 400);
  }

  const latitude1 = parseFloat(lat1 as string);
  const longitude1 = parseFloat(lng1 as string);
  const latitude2 = parseFloat(lat2 as string);
  const longitude2 = parseFloat(lng2 as string);

  if (!LocationService.validateCoordinates(latitude1, longitude1) ||
      !LocationService.validateCoordinates(latitude2, longitude2)) {
    throw new AppError('Invalid coordinates', 400);
  }

  const distance = LocationService.calculateDistance(latitude1, longitude1, latitude2, longitude2);

  res.status(200).json({
    status: 'success',
    data: {
      distance_km: Math.round(distance * 100) / 100, // Round to 2 decimal places
      coordinates: {
        point1: { latitude: latitude1, longitude: longitude1 },
        point2: { latitude: latitude2, longitude: longitude2 }
      }
    },
  });
});

export const searchCities = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit } = req.query;

  if (!q || typeof q !== 'string') {
    throw new AppError('Search query is required', 400);
  }

  if (q.length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }

  const searchLimit = limit ? Math.min(parseInt(limit as string), 20) : 10;
  const cities = await LocationService.searchCities(q, searchLimit);

  res.status(200).json({
    status: 'success',
    data: cities,
  });
});
