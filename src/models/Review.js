import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // nombre del modelo al que se hace referencia
  },
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialist', // nombre del modelo al que se hace referencia
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number,
    required: true,
  },
});

const Review = mongoose.model('Review', reviewSchema);

export { Review, reviewSchema };