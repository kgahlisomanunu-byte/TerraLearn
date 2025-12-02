import GeoPoint from '../models/GeoPoint.model.js';

export class GeoService {
  // Create new geo point
  static async createGeoPoint(geoData, createdBy) {
    const geoPoint = await GeoPoint.create({
      ...geoData,
      createdBy
    });

    return geoPoint;
  }

  // Get all geo points with filtering
  static async getGeoPoints(query = {}) {
    const { 
      page = 1, 
      limit = 50, 
      type, 
      tags, 
      bounds,
      search 
    } = query;

    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (type) {
      filter.type = type;
    }

    if (tags) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Spatial query for bounds
    if (bounds) {
      const { sw, ne } = bounds;
      filter['coordinates.lat'] = { $gte: sw.lat, $lte: ne.lat };
      filter['coordinates.lng'] = { $gte: sw.lng, $lte: ne.lng };
    }

    const geoPoints = await GeoPoint.find(filter)
      .populate('lesson', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GeoPoint.countDocuments(filter);

    return {
      geoPoints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get geo points within radius
  static async getGeoPointsWithinRadius(center, radiusInKm, filters = {}) {
    const geoPoints = await GeoPoint.findWithinRadius(center, radiusInKm)
      .populate('lesson', 'title')
      .populate('createdBy', 'name');

    // Apply additional filters
    let filteredPoints = geoPoints;
    
    if (filters.type) {
      filteredPoints = filteredPoints.filter(point => point.type === filters.type);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredPoints = filteredPoints.filter(point => 
        point.tags.some(tag => filters.tags.includes(tag))
      );
    }

    return filteredPoints;
  }

  // Get geo point by ID
  static async getGeoPointById(geoPointId) {
    const geoPoint = await GeoPoint.findById(geoPointId)
      .populate('lesson', 'title description content')
      .populate('createdBy', 'name email');

    if (!geoPoint) {
      throw new Error('Geo point not found');
    }

    return geoPoint;
  }

  // Update geo point
  static async updateGeoPoint(geoPointId, updateData, user) {
    const geoPoint = await GeoPoint.findById(geoPointId);

    if (!geoPoint) {
      throw new Error('Geo point not found');
    }

    // Check if user has permission to update
    if (user.role !== 'admin' && geoPoint.createdBy.toString() !== user._id.toString()) {
      throw new Error('Not authorized to update this geo point');
    }

    const allowedUpdates = [
      'title', 'description', 'coordinates', 'type', 'media', 
      'tags', 'population', 'area', 'elevation', 'climate', 'facts'
    ];

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        geoPoint[key] = updateData[key];
      }
    });

    await geoPoint.save();
    return geoPoint;
  }

  // Delete geo point
  static async deleteGeoPoint(geoPointId, user) {
    const geoPoint = await GeoPoint.findById(geoPointId);

    if (!geoPoint) {
      throw new Error('Geo point not found');
    }

    // Check if user has permission to delete
    if (user.role !== 'admin' && geoPoint.createdBy.toString() !== user._id.toString()) {
      throw new Error('Not authorized to delete this geo point');
    }

    await GeoPoint.findByIdAndDelete(geoPointId);
    return geoPoint;
  }

  // Get geo points by type distribution (for analytics)
  static async getGeoPointsByType() {
    const distribution = await GeoPoint.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    return distribution;
  }

  // Search geo points with advanced filters
  static async searchGeoPoints(searchCriteria) {
    const {
      query,
      types = [],
      tags = [],
      minPopulation,
      maxPopulation,
      sortBy = 'title',
      sortOrder = 'asc'
    } = searchCriteria;

    const filter = { isActive: true };

    // Text search
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    // Type filter
    if (types.length > 0) {
      filter.type = { $in: types };
    }

    // Tags filter
    if (tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Population range filter
    if (minPopulation !== undefined || maxPopulation !== undefined) {
      filter.population = {};
      if (minPopulation !== undefined) filter.population.$gte = minPopulation;
      if (maxPopulation !== undefined) filter.population.$lte = maxPopulation;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const geoPoints = await GeoPoint.find(filter)
      .populate('lesson', 'title')
      .populate('createdBy', 'name')
      .sort(sortOptions);

    return geoPoints;
  }
}