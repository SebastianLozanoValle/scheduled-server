// import mongoose from "mongoose";
// import { Specialist } from "./models/Specialist.js";

// export const resolvers = {
//     Query: {
//         specialistCount: () => Specialist.countDocuments(),
//         findBySpecialtys: async (_, { specialtys }) => {
//             if (!specialtys || specialtys.length === 0) {
//                 return Specialist.find();
//             }

//             return Specialist.find({ specialtys: { $in: specialtys } });
//         },
//         findSpecialistByName: (_, { name }) => Specialist.findOne({ name }),
//     },

//     Mutation: {
//         createSpecialist: (_, { specialist }) => {
//             const newSpecialist = new Specialist(specialist);
//             return newSpecialist.save();
//         },
//         updateSpecialist: async (_, { id, specialist }) => {
//             return Specialist.findByIdAndUpdate(id, specialist, { new: true });
//         },
//         deleteSpecialist: async (_, { id }) => {
//             return Specialist.findByIdAndRemove(id);
//         },
//         addAppointment: async (_, { specialistId, month, day, appointment }) => {
//             const specialist = await Specialist.findById(specialistId);
//             if (!specialist) {
//                 throw new Error("Especialista no encontrado");
//             }

//             let monthlySchedule = specialist.monthlySchedule.find((ms) => ms.month === month);
//             if (!monthlySchedule) {
//                 monthlySchedule = { month, days: [] };
//                 specialist.monthlySchedule.push(monthlySchedule);
//             }

//             let daySchedule = monthlySchedule.days.find((ds) => ds.day === day);
//             if (!daySchedule) {
//                 daySchedule = { day, horariosDisponibles: [], citas: [] };
//                 monthlySchedule.days.push(daySchedule);
//             }

//             daySchedule.citas.push(appointment);
//             specialist.save();
//             return appointment;
//         },
//         changeSpecialtys: async (_, { name, specialtys }) => {
//             const specialist = await Specialist.findOne({ name });
//             if (!specialist) {
//                 throw new Error("Especialista no encontrado");
//             }

//             specialist.specialtys = specialtys;
//             return specialist.save();
//         },
//         scheduleAppointment: async (_, { specialistId, month, day, newAppointment }) => {
//             const specialist = await Specialist.findById(specialistId);

//             if (!specialist) {
//                 throw new Error("Especialista no encontrado");
//             }

//             // Encuentra el horario del día específico en el mes
//             let monthlySchedule = specialist.monthlySchedule.find((ms) => ms.month === month);

//             // Si el calendario mensual no existe, créalo
//             if (!monthlySchedule) {
//                 monthlySchedule = { month, days: [] };
//                 specialist.monthlySchedule.push(monthlySchedule);
//             }

//             let daySchedule = monthlySchedule.days.find((ds) => ds.day === day);

//             // Si el día no existe, créalo
//             if (!daySchedule) {
//                 daySchedule = { day, horariosDisponibles: [], citas: [] };
//                 monthlySchedule.days.push(daySchedule);
//             }

//             // Verifica si el nuevo horario de cita está dentro del rango de horarios disponibles
//             const convertTimeToMinutes = (time) => {
//                 const [hours, minutes] = time.split(':').map(Number);
//                 return hours * 60 + minutes;
//             };

//             const isSlotAvailable = daySchedule.horariosDisponibles.some(
//                 (timeSlot) => {
//                     const slotStart = convertTimeToMinutes(timeSlot.start);
//                     const slotEnd = convertTimeToMinutes(timeSlot.end);
//                     const appointmentStart = convertTimeToMinutes(newAppointment.startTime);
//                     const appointmentEnd = convertTimeToMinutes(newAppointment.endTime);

//                     // Verificar si el nuevo horario está fuera de los horarios disponibles
//                     return appointmentStart >= slotStart && appointmentEnd <= slotEnd;
//                 }
//             );

//             if (!isSlotAvailable) {
//                 throw new Error("El horario de cita especificado no está dentro del rango de horarios disponibles");
//             }

//             // Verifica si la nueva cita se superpone con otras citas existentes
//             const isSlotOccupied = daySchedule.citas.some(
//                 (existingAppointment) =>
//                     (newAppointment.startTime >= existingAppointment.startTime && newAppointment.startTime < existingAppointment.endTime) ||
//                     (newAppointment.endTime > existingAppointment.startTime && newAppointment.endTime <= existingAppointment.endTime) ||
//                     (newAppointment.startTime <= existingAppointment.startTime && newAppointment.endTime >= existingAppointment.endTime)
//             );

//             if (isSlotOccupied) {
//                 throw new Error("El horario de cita especificado se superpone con otra cita existente");
//             }

//             // Agrega la nueva cita
//             const newAppointmentData = {
//                 id: mongoose.Types.ObjectId(),
//                 ...newAppointment,
//             };

//             daySchedule.citas.push(newAppointmentData);
//             specialist.save();

//             return newAppointmentData;
//         },
//     },
// };

import mongoose from "mongoose";
import { Specialist } from "./models/Specialist.js";

export const resolvers = {
    Query: {
        specialistCount: () => Specialist.countDocuments(),
        findBySpecialtys: async (_, { specialtys }) => {
            if (!specialtys || specialtys.length === 0) {
                return Specialist.find();
            }

            return Specialist.find({ specialtys: { $in: specialtys } });
        },
        findSpecialistByName: (_, { name }) => Specialist.findOne({ name }),
    },

    Mutation: {
        createSpecialist: async (_, { input }) => {
            try {
              const newSpecialist = await Specialist.create(input);
              return newSpecialist;
            } catch (error) {
              console.error(error);
              throw error; // Throw the error so it can be seen in the mutation response
            }
          },
        updateSpecialist: async (_, { id, specialist }) => {
            return Specialist.findByIdAndUpdate(id, specialist, { new: true });
        },
        deleteSpecialist: async (_, { id }) => {
            return Specialist.findByIdAndRemove(id);
        },
        changeSpecialtys: async (_, { name, specialtys }) => {
            const specialist = await Specialist.findOne({ name });
            if (!specialist) {
                throw new Error("Especialista no encontrado");
            }

            specialist.specialtys = specialtys;
            return specialist.save();
        },
        scheduleAppointment: async (_, { specialistId, month, day, newAppointment }) => {
            const specialist = await Specialist.findById(specialistId);

            if (!specialist) {
                throw new Error("Especialista no encontrado");
            }

            // Encuentra el horario del día específico en el mes
            let monthlySchedule = specialist.monthlySchedule.find((ms) => ms.month === month);

            // Si el calendario mensual no existe, créalo
            if (!monthlySchedule) {
                monthlySchedule = { month, days: [] };
                specialist.monthlySchedule.push(monthlySchedule);
            }

            let daySchedule = monthlySchedule.days.find((ds) => ds.day === day);

            // Si el día no existe, créalo
            if (!daySchedule) {
                daySchedule = { day, horariosDisponibles: [], citas: [] };
                monthlySchedule.days.push(daySchedule);
            }

            // Verifica si el nuevo horario de cita está dentro del rango de horarios disponibles
            const convertTimeToMinutes = (time) => {
                const [hours, minutes] = time.split(':').map(Number);
                return hours * 60 + minutes;
            };

            const isSlotAvailable = daySchedule.horariosDisponibles.some(
                (timeSlot) => {
                    const slotStart = convertTimeToMinutes(timeSlot.start);
                    const slotEnd = convertTimeToMinutes(timeSlot.end);
                    const appointmentStart = convertTimeToMinutes(newAppointment.startTime);
                    const appointmentEnd = convertTimeToMinutes(newAppointment.endTime);

                    // Verificar si el nuevo horario está fuera de los horarios disponibles
                    return appointmentStart >= slotStart && appointmentEnd <= slotEnd;
                }
            );

            if (!isSlotAvailable) {
                throw new Error("El horario de cita especificado no está dentro del rango de horarios disponibles");
            }

            // Verifica si la nueva cita se superpone con otras citas existentes
            const isSlotOccupied = daySchedule.citas.some(
                (existingAppointment) =>
                    (newAppointment.startTime >= existingAppointment.startTime && newAppointment.startTime < existingAppointment.endTime) ||
                    (newAppointment.endTime > existingAppointment.startTime && newAppointment.endTime <= existingAppointment.endTime) ||
                    (newAppointment.startTime <= existingAppointment.startTime && newAppointment.endTime >= existingAppointment.endTime)
            );

            if (isSlotOccupied) {
                throw new Error("El horario de cita especificado se superpone con otra cita existente");
            }

            // Agrega la nueva cita
            const newAppointmentData = {
                id: mongoose.Types.ObjectId(),
                ...newAppointment,
                duration: convertTimeToMinutes(newAppointment.endTime) - convertTimeToMinutes(newAppointment.startTime),
            };

            daySchedule.citas.push(newAppointmentData);
            specialist.save();

            return newAppointmentData;
        },
        // updateAddress: async (_, { id, address }) => {
        //     const specialist = await Specialist.findById(id);
        //     if (!specialist) {
        //         throw new Error("Especialista no encontrado");
        //     }

        //     specialist.address = address;
        //     return specialist.save();
        // },
    },
};