import mongoose from "mongoose";
import { Specialist } from "./models/Specialist.js";
import { Appointment } from "./models/Appointment.js";
import { Client } from "./models/Client.js";

const getMonthAndDay = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // Los meses en JavaScript van de 0 a 11, por lo que necesitamos sumar 1
    const day = date.getDate(); // Los días en JavaScript van de 1 a 31
    return { month, day };
};

const convertTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

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
            const newSpecialist = await Specialist.create(input);
            return newSpecialist;
        },
        createClient: async (_, { input }) => {
            const newClient = await Client.create(input);
            return newClient;
        },
        createAppointment: async (_, { input }) => {
            // Buscar el especialista
            const specialist = await Specialist.findById(input.specialistId);
            if (!specialist) {
              throw new Error('Specialist not found');
            }
          
            // Buscar el cliente
            const client = await Client.findById(input.clientId);
            if (!client) {
              throw new Error('Client not found');
            }
          
            // Verificar si el especialista tiene horario para el día de la cita
            const dayOfWeek = new Date(input.date).getDay();
            const schedule = specialist.monthlySchedule.find(s => s.dayOfWeek === dayOfWeek);
            if (!schedule) {
              throw new Error('Specialist does not work on this day');
            }
          
            // Verificar si la cita está dentro del horario del especialista
            if (input.startTime < schedule.startTime || input.estimatedEndTime > schedule.endTime) {
              throw new Error('Appointment is not within specialist working hours');
            }
          
            // Verificar si la cita se cruza con otras citas del especialista
            const overlappingSpecialistAppointment = await Appointment.findOne({
              specialistId: input.specialistId,
              date: input.date,
              $or: [
                { startTime: { $lt: input.estimatedEndTime, $gte: input.startTime } },
                { estimatedEndTime: { $gt: input.startTime, $lte: input.estimatedEndTime } },
              ],
            });
            if (overlappingSpecialistAppointment) {
              throw new Error('Appointment overlaps with another appointment of the specialist');
            }
          
            // Verificar si la cita se cruza con otras citas del cliente
            const overlappingClientAppointment = await Appointment.findOne({
              clientId: input.clientId,
              date: input.date,
              $or: [
                { startTime: { $lt: input.estimatedEndTime, $gte: input.startTime } },
                { estimatedEndTime: { $gt: input.startTime, $lte: input.estimatedEndTime } },
              ],
            });
            if (overlappingClientAppointment) {
              throw new Error('Appointment overlaps with another appointment of the client');
            }
          
            // Crear la cita
            const newAppointment = await Appointment.create(input);
            return newAppointment;
        },
        updateSpecialist: async (_, { id, input }) => {
            return Specialist.findByIdAndUpdate(id, input, { new: true });
        },
        updateClient: async (_, { id, input }) => {
            return Client.findByIdAndUpdate(id, input, { new: true });
        },
        deleteSpecialist: async (_, { id }) => {
            return Specialist.findByIdAndDelete(id);
        },
        changeSpecialtys: async (_, { name, specialtys }) => {
            const specialist = await Specialist.findOne({ name });
            if (!specialist) {
                throw new Error("Especialista no encontrado");
            }

            specialist.specialtys = specialtys;
            return specialist.save();
        },
        scheduleAppointment: async (_, { input }) => {
            const { specialistId, date, startTime, estimatedEndTime, clientId, subject, detail, value, status } = input;
        
            // Extrae el mes y el día de la fecha
            const { month, day } = getMonthAndDay(date);
            const dayOfWeek = new Date(input.date).getDay();
        
            // Mapea los números de los días de la semana a los nombres de los días
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
            // Obtén el nombre del día de la semana correspondiente
            const dayName = daysOfWeek[dayOfWeek];
        
            const specialist = await Specialist.findById(specialistId);
            const client = await Client.findById(clientId);
        
            if (!specialist) {
                throw new Error("Especialista no encontrado");
            }
        
            if (!client) {
                throw new Error("Cliente no encontrado");
            }
        
            // Encuentra el horario del día específico en el mes
            let monthlySchedule = specialist.monthlySchedule.find((ms) => ms.month === month);
        
            // Si el calendario mensual no existe, créalo
            if (!monthlySchedule) {
                monthlySchedule = { month, days: [] };
                specialist.monthlySchedule.push(monthlySchedule);
            }
        
            let daySchedule = monthlySchedule.days.find((ds) => new Date(ds.date).getDate() === day);
        
            // Si el día no existe, créalo
            if (!daySchedule) {
                // Usa el nombre del día para obtener el horario semanal correspondiente
                const weeklySchedule = specialist.weeklySchedule[dayName];
        
                daySchedule = { date: day, horariosDisponibles: weeklySchedule, appointments: [] };
                monthlySchedule.days.push(daySchedule);
            }
        
            // Verifica si el nuevo horario de cita está dentro del rango de horarios disponibles
            const isSlotAvailable = daySchedule.horariosDisponibles && daySchedule.horariosDisponibles.some(
                (timeSlot) => {
                    const slotStart = convertTimeToMinutes(timeSlot.start);
                    const slotEnd = convertTimeToMinutes(timeSlot.end);
                    const appointmentStart = convertTimeToMinutes(startTime);
                    const appointmentEnd = convertTimeToMinutes(estimatedEndTime);
        
                    // Verificar si el nuevo horario está fuera de los horarios disponibles
                    return appointmentStart >= slotStart && appointmentEnd <= slotEnd;
                }
            );
        
            if (!isSlotAvailable) {
                const availableSlots = JSON.stringify(daySchedule.horariosDisponibles);
                throw new Error(`El horario de cita especificado no está dentro del rango de horarios disponibles. Los horarios disponibles son: ${availableSlots}`);
            }
        
            // Verifica si la nueva cita se superpone con otras citas existentes
            const isSlotOccupied = daySchedule.appointments && daySchedule.appointments.some(
                (existingAppointment) => {
                    const existingStart = convertTimeToMinutes(existingAppointment.startTime);
                    const existingEnd = convertTimeToMinutes(existingAppointment.endTime);
                    const newStart = convertTimeToMinutes(startTime);
                    const newEnd = convertTimeToMinutes(estimatedEndTime);
        
                    return (
                        (newStart >= existingStart && newStart < existingEnd) ||
                        (newEnd > existingStart && newEnd <= existingEnd) ||
                        (newStart <= existingStart && newEnd >= existingEnd)
                    );
                }
            );
        
            if (isSlotOccupied) {
                throw new Error("El horario de cita especificado se superpone con otra cita existente");
            }
        
            // Agrega la nueva cita
            const newAppointmentData = new Appointment({
                id: new mongoose.Types.ObjectId(),
                ...input,
                duration: convertTimeToMinutes(estimatedEndTime) - convertTimeToMinutes(startTime),
            });
        
            // Guardar la nueva cita en la base de datos
            await newAppointmentData.save();
        
            // Agregar la cita a los appointments del cliente
            client.appointments.push(newAppointmentData);
            await client.save();
        
            daySchedule.appointments.push(newAppointmentData);
            await specialist.save();
        
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