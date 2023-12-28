const specialistSchema = new mongoose.Schema({
  ...userSchema.obj, // inherit user schema
  specialtys:  {
    type: [String],
    enum: ['Peluqueria', 'Manicura', 'Pedicura'],
  },
  world:  {
    type: String,
    enum: ['Hombre', 'Mujer', 'Mascota'],
  },
  appointments: [appointmentSchema], // new appointments property
  weeklySchedule: {
    Monday: [timeSlotSchema],
    Tuesday: [timeSlotSchema],
    Wednesday: [timeSlotSchema],
    Thursday: [timeSlotSchema],
    Friday: [timeSlotSchema],
    Saturday: [timeSlotSchema],
    Sunday: [timeSlotSchema]
  },
  reviews: [reviewSchema],
  paymentOption: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
  },
  completedAppointments: [appointmentSchema],
  highlighted: {
    type: Boolean,
    default: false,
  },
  serviceType: {
    type: String,
    enum: ['Domicilio', 'Casa', 'Mixto'],
  },
});

const Specialist = mongoose.model('Specialist', specialistSchema);

export { Specialist, specialistSchema };