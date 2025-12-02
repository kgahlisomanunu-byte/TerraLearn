import { GeoService } from '../services/geo.service.js';
import { validationResult } from 'express-validator';

export const createGeoPoint = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const geoPoint = await GeoService.createGeoPoint(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: geoPoint
    });
  } catch (error) {
    next(error);
  }
};

export const getGeoPoints = async (req, res, next) => {
  try {
    const result = await GeoService.getGeoPoints(req.query);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getGeoPoint = async (req, res, next) => {
  try {
    const geoPoint = await GeoService.getGeoPointById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: geoPoint
    });
  } catch (error) {
    next(error);
  }
};

export const updateGeoPoint = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const geoPoint = await GeoService.updateGeoPoint(
      req.params.id,
      req.body,
      req.user
    );
    
    res.status(200).json({
      success: true,
      data: geoPoint
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGeoPoint = async (req, res, next) => {
  try {
    await GeoService.deleteGeoPoint(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Geo point deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getGeoPointsWithinRadius = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const center = [parseFloat(lng), parseFloat(lat)];
    const radiusInKm = parseFloat(radius);

    const geoPoints = await GeoService.getGeoPointsWithinRadius(
      center,
      radiusInKm,
      req.query
    );
    
    res.status(200).json({
      success: true,
      data: geoPoints
    });
  } catch (error) {
    next(error);
  }
};

export const getGeoPointsByType = async (req, res, next) => {
  try {
    const distribution = await GeoService.getGeoPointsByType();
    
    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

export const searchGeoPoints = async (req, res, next) => {
  try {
    const { q, types, tags, minPopulation, maxPopulation, sortBy, sortOrder } = req.query;
    
    const searchCriteria = {
      query: q,
      types: types ? types.split(',') : [],
      tags: tags ? tags.split(',') : [],
      minPopulation: minPopulation ? parseInt(minPopulation) : undefined,
      maxPopulation: maxPopulation ? parseInt(maxPopulation) : undefined,
      sortBy,
      sortOrder
    };

    const geoPoints = await GeoService.searchGeoPoints(searchCriteria);
    
    res.status(200).json({
      success: true,
      data: geoPoints
    });
  } catch (error) {
    next(error);
  }
};

export const uploadGeoPointMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const geoPoint = await GeoPoint.findById(id);
    
    if (!geoPoint) {
      return res.status(404).json({
        success: false,
        message: 'Geo point not found'
      });
    }

    // Upload files to Cloudinary and add to media array
    const uploadPromises = files.map(async (file) => {
      const result = await uploadToCloudinary(file.path, `geolearnhub/geopoints/${id}`);
      
      return {
        url: result.secure_url,
        type: file.mimetype.startsWith('image') ? 'image' : 
              file.mimetype.startsWith('video') ? 'video' : 'other',
        caption: file.originalname
      };
    });

    const mediaItems = await Promise.all(uploadPromises);
    geoPoint.media.push(...mediaItems);
    await geoPoint.save();

    res.status(200).json({
      success: true,
      data: {
        media: mediaItems,
        message: 'Media uploaded successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};