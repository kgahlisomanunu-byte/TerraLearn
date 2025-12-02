import mongoose from 'mongoose';

const coordinateSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  }
});

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'audio', 'interactive'],
    required: true
  },
  caption: {
    type: String,
    maxlength: [200, 'Caption cannot exceed 200 characters']
  },
  description: String
});

const geoPointSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  coordinates: {
    type: coordinateSchema,
    required: true
  },
  type: {
    type: String,
    enum: ['landmark', 'terrain', 'historical', 'cultural', 'climate', 'economic', 'political'],
    required: true
  },
  media: [mediaSchema],
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  tags: [{
    type: String,
    trim: true
  }],
  population: Number,
  area: Number,
  elevation: Number,
  climate: String,
  facts: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 2dsphere index for geospatial queries
geoPointSchema.index({ coordinates: '2dsphere' });
geoPointSchema.index({ type: 1 });
geoPointSchema.index({ tags: 1 });
geoPointSchema.index({ lesson: 1 });

// Static method for finding points within radius
geoPointSchema.statics.findWithinRadius = function(center, radiusInKm) {
  return this.find({
    coordinates: {
      $geoWithin: {
        $centerSphere: [center, radiusInKm / 6378.1] // Convert km to radians
      }
    }
  });
};

// Instance method to get formatted coordinates
geoPointSchema.methods.getFormattedCoordinates = function() {
  return `${this.coordinates.lat.toFixed(4)}, ${this.coordinates.lng.toFixed(4)}`;
};

export default mongoose.model('GeoPoint', geoPointSchema);