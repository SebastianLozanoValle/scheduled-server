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
        findSpecialists: async (_, { specialtys }) => {
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
        
            // Extrae el día de la semana de la fecha
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
        
            // Usa el nombre del día para obtener el horario semanal correspondiente
            const weeklySchedule = specialist.weeklySchedule[dayName];
        
            // throw new Error(`startTime: ${startTime}, estimatedEndTime: ${estimatedEndTime}`);
            // throw new Error(`startTime: ${timeSlot.start}, estimatedEndTime: ${timeSlot.end}`);
            // throw new Error(`timeSlot: ${timeSlot}`);

            // if (!startTime || !estimatedEndTime || !timeSlot.start || !timeSlot.end || !existingAppointment.startTime || !existingAppointment.endTime) {
            //     throw new Error("Uno de los valores de tiempo es undefined");
            // }
        
            // Verifica si el nuevo horario de cita está dentro del rango de horarios disponibles
            // if (!startTime || !estimatedEndTime) {
            //     throw new Error(` ${startTime}, ${estimatedEndTime}`);
            // }
            
            const isSlotAvailable = weeklySchedule && weeklySchedule.some(
                (timeSlot) => {

                    // if (!timeSlot.start || !timeSlot.end) {
                    //     throw new Error("timeSlot.start o timeSlot.end son undefined");
                    // }
            
                    const slotStart = convertTimeToMinutes(timeSlot.start);
                    const slotEnd = convertTimeToMinutes(timeSlot.end);
                    const appointmentStart = convertTimeToMinutes(startTime);
                    const appointmentEnd = convertTimeToMinutes(estimatedEndTime);
            
                    // Verificar si el nuevo horario está fuera de los horarios disponibles
                    return appointmentStart >= slotStart && appointmentEnd <= slotEnd;
                }
            );
            
            if (!isSlotAvailable) {
                throw new Error("El horario de la cita no está disponible");
            }
            
            const isTimeOccupied = specialist.appointments.some(
                (existingAppointment) => {
                    if (!existingAppointment.startTime || !existingAppointment.estimatedEndTime || !existingAppointment.date) {
                        throw new Error("existingAppointment.startTime, existingAppointment.endTime o existingAppointment.date son undefined");
                    }
            
                    const existingStart = convertTimeToMinutes(existingAppointment.startTime);
                    const existingEnd = convertTimeToMinutes(existingAppointment.estimatedEndTime);
                    const appointmentStart = convertTimeToMinutes(startTime);
                    const appointmentEnd = convertTimeToMinutes(estimatedEndTime);
            
                    // Verificar si la fecha de la nueva cita es la misma que la de la cita existente
                    const isSameDate = new Date(existingAppointment.date).toDateString() === new Date(date).toDateString();
            
                    // Verificar si el nuevo horario se superpone con una cita existente en la misma fecha
                    return isSameDate && ((appointmentStart >= existingStart && appointmentStart < existingEnd) ||
                           (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
                           (appointmentStart <= existingStart && appointmentEnd >= existingEnd));
                }
            );
            
            if (isTimeOccupied) {
                throw new Error("El horario de la cita ya está ocupado");
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
        
            // Agregar la cita a los appointments del especialista
            specialist.appointments.push(newAppointmentData);
            await specialist.save();
        
            return newAppointmentData;
        },
        toggleSpecialistHighlight: async (_, { id }) => {
            const specialist = await Specialist.findById(id);
            if (!specialist) {
                throw new Error('Specialist not found');
            }
            specialist.highlighted = !specialist.highlighted;
            await specialist.save();
            return specialist;
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