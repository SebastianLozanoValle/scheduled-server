import { ApolloServer, gql } from 'apollo-server';
import { v1 as uuid } from 'uuid';

const specialists = [
    {
        "id": "1qrqwer-qwerqwer-qwerqwerrr-wrererw",
        "name": "Juan",
        "phone": "034-1234567",
        "street": "Calle FrontEnd",
        "city": "Barcelona",
        "world": "dev",
        "specialtys": ["REACT", "FRONTEND"],
        "monthlySchedule": [
            {
                "month": "2023-12",
                "days": [
                    {
                        "day": "2023-12-01",
                        "horariosDisponibles": [
                            { "start": "09:00", "end": "09:30" },
                            { "start": "12:30", "end": "14:30" },
                            { "start": "18:30", "end": "20:00" }
                        ],
                        "citas": [
                            {
                                "id": "jhakjsd-sdfasfda",
                                "startTime": "09:30",
                                "duration": 30,
                                "clientName": "Cliente7",
                                "subject": "Entrevista",
                                "detail": "Entrevista para posición de diseñador gráfico."
                            },
                            {
                                "id": "asdfafsd-asdfasdf",
                                "startTime": "10:00",
                                "duration": 30,
                                "clientName": "Cliente8",
                                "subject": "Consulta",
                                "detail": "Discusión sobre plan de tratamiento."
                            },
                        ]
                    },
                    // ... otros días
                ]
            },
            // ... otros meses
        ],
    },
    {
        "id": "2qrqwer-qwerqwer-qwerqwerrr-wrererw",
        "name": "Sebastian",
        "phone": "034-1234567",
        "street": "Calle FrontEnd",
        "city": "Barcelona",
        "world": "dev",
        "specialtys": ["REACT", "SPRING"],
        "monthlySchedule": [
            {
                "month": "2023-12",
                "days": [
                    {
                        "day": "2023-12-01",
                        "horariosDisponibles": [
                            { "start": "09:00", "end": "09:30" },
                            { "start": "12:30", "end": "14:30" },
                            { "start": "18:30", "end": "20:00" }
                        ],
                        "citas": [
                            {
                                "id": "jhakjsd-sdfasfda",
                                "startTime": "09:30",
                                "duration": 30,
                                "clientName": "Cliente7",
                                "subject": "Entrevista",
                                "detail": "Entrevista para posición de diseñador gráfico."
                            },
                            {
                                "id": "asdfafsd-asdfasdf",
                                "startTime": "10:00",
                                "duration": 30,
                                "clientName": "Cliente8",
                                "subject": "Consulta",
                                "detail": "Discusión sobre plan de tratamiento."
                            },
                        ]
                    },
                    // ... otros días
                ]
            },
            // ... otros meses
        ],
    },
    // ... otros especialistas
];

const typeDefs = gql`
    enum DevelopmentSpecialty {
        REACT
        FRONTEND
        GRAPHQL
        NODEJS
        GO
    }

    type Address {
        street: String!
        city: String!
    }

    type Appointment {
        id: ID!
        startTime: String!
        duration: Int!
        clientName: String!
        subject: String!
        detail: String
    }

    type TimeSlot {
        start: String!
        end: String!
    }

    type DaySchedule {
        day: String!
        horariosDisponibles: [TimeSlot]!
        citas: [Appointment]
    }

    type MonthlySchedule {
        month: String!
        days: [DaySchedule]
    }

    type Specialist {
        id: ID!
        name: String!
        phone: String
        address: Address!
        world: String!
        specialtys: [String]!
        monthlySchedule: [MonthlySchedule]
        isActive: Boolean!
    }

    input TimeSlotInput {
        start: String!
        end: String!
    }

    input DayScheduleInput {
        day: String!
        horariosDisponibles: [TimeSlotInput]!
        citas: [AppointmentInput]
    }

    input MonthlyScheduleInput {
        month: String!
        days: [DayScheduleInput]
    }

    input AddressInput {
        street: String!
        city: String!
    }

    input AppointmentInput {
        id: ID!
        startTime: String!
        duration: Int!
        clientName: String!
        subject: String!
        detail: String
    }

    input SpecialistInput {
        name: String!
        phone: String
        street: String!
        city: String!
        world: String!
        specialtys: [String]!
        monthlySchedule: [MonthlyScheduleInput]
        isActive: Boolean!
    }
    input NewAppointmentInput {
        startTime: String!
        endTime: String!
        duration: Int!
        clientName: String!
        subject: String!
        detail: String
    }


    type Query {
        specialistCount: Int!
        allSpecialists(specialtys: [DevelopmentSpecialty]): [Specialist]!
        findSpecialist(name: String!): Specialist
    }


    type Mutation {
        addSpecialist(specialist: SpecialistInput): Specialist
        addAppointment(specialistId: ID!, month: String!, day: String!, appointment: AppointmentInput): Appointment
        changeSpecialtys(name: String!, specialtys: [DevelopmentSpecialty]): Specialist
        scheduleAppointment(
            specialistId: ID!
            month: String!
            day: String!
            newAppointment: NewAppointmentInput!
        ): Appointment
    }
`;

const resolvers = {
    Query: {
        specialistCount: () => specialists.length,
        allSpecialists: (_, { specialtys }) => {
            if (!specialtys || specialtys.length === 0) {
                return specialists;
            }

            return specialists.filter((specialist) => {
                return specialist.specialtys
                    .some((s) => specialtys.includes(s));
            });
        },
        findSpecialist: (_, { name }) => specialists.find((specialist) => specialist.name === name),
    },

    Mutation: {
        addSpecialist: (_, { specialist }) => {
            const newSpecialist = { ...specialist, id: uuid() };
            specialists.push(newSpecialist);
            return newSpecialist;
        },
        addAppointment: (_, { specialistId, month, day, appointment }) => {
            const specialist = specialists.find((s) => s.id === specialistId);
            if (!specialist) {
                throw new Error("Especialista no encontrado");
            }

            let monthlySchedule = specialist.monthlySchedule.find((ms) => ms.month === month);
            if (!monthlySchedule) {
                monthlySchedule = { month, days: [] };
                specialist.monthlySchedule.push(monthlySchedule);
            }

            let daySchedule = monthlySchedule.days.find((ds) => ds.day === day);
            if (!daySchedule) {
                daySchedule = { day, horariosDisponibles: [], citas: [] };
                monthlySchedule.days.push(daySchedule);
            }

            daySchedule.citas.push(appointment);
            return appointment;
        },

        changeSpecialtys: (_, { name, specialtys }) => {
            const specialistIndex = specialists.findIndex(s => s.name === name)
            if (specialistIndex === -1) return null

            const specialist = specialists[specialistIndex]

            const updatedSpecialist = { ...specialist, specialtys }
            specialists[specialistIndex] = updatedSpecialist
            return updatedSpecialist
        },
        scheduleAppointment: (_, { specialistId, month, day, newAppointment }) => {
            const specialist = specialists.find((s) => s.id === specialistId);

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
                return hours * 100 + minutes;
            };
            
            const isSlotAvailable = [{ "start": "09:00", "end": "09:30" },{ "start": "12:30", "end": "14:30" },{ "start": "18:30", "end": "20:00" }].some(
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
                id: uuid(),
                ...newAppointment,
            };

            daySchedule.citas.push(newAppointmentData);

            return newAppointmentData;
        },
    },
    Specialist: {
        address: (root) => ({ street: root.street, city: root.city }),
        isActive: () => true,
    },
};

// const server = new ApolloServer({
//     typeDefs,
//     resolvers,
// });

// server.listen().then(({ url }) => {
//     console.log(`Server ready at ${url}`);
// });
const corsOptions = {
    origin: 'http://localhost:5173', // Cambia esto con el dominio de tu aplicación en desarrollo
    credentials: true,
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    cors: corsOptions,
});

// Arrancar el servidor
const PORT = 4000;

server.listen(PORT).then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
