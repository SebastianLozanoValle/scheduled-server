import { gql } from "apollo-server-express";

export const typeDefs = gql`
    # GraphQL typedefs
    type User {
        id: ID!
        username: String!
        password: String!
        avatar: String
        age: Int!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean!
    }

    enum Role {
        admin
        specialist
        client
    }

    input UserInput {
        username: String!
        password: String!
        avatar: String
        age: Int!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean
    }

    type Appointment {
        id: ID!
        date: String!
        startTime: String!
        estimatedEndTime: String!
        clientId: ID!
        specialistId: ID!
        subject: String!
        detail: String
        value: Float!
        status: Status!
    }

    enum Status {
        waiting
        scheduled
        pending
        completed
    }

    enum Specialty {
        Peluqueria
        Manicura
        Pedicura
    }

    enum World {
        Hombre
        Mujer
        Mascota
    }

    enum PaymentOption {
        weekly
        biweekly
        monthly
    }

    input AppointmentInput {
        date: String!
        startTime: String!
        estimatedEndTime: String!
        clientId: ID!
        specialistId: ID!
        subject: String!
        detail: String
        value: Float!
        status: Status
    }

    type Review {
        id: ID!
        userId: ID!
        specialistId: ID!
        title: String!
        text: String!
        createdAt: String!
        rating: Float!
    }

    input ReviewInput {
        userId: ID!
        specialistId: ID!
        title: String!
        text: String!
        rating: Float!
    }

    type TimeSlot {
        start: String!
        end: String!
    }

    input TimeSlotInput {
        start: String!
        end: String!
    }

    type Day {
        date: String!
        availableTimeSlots: [TimeSlot]!
        appointments: [Appointment]!
        weekday: String!
    }

    input DayInput {
        date: String!
        availableTimeSlots: [TimeSlotInput]!
        appointments: [AppointmentInput]!
    }

    type MonthlySchedule {
        month: String!
        days: [Day]!
    }

    input MonthlyScheduleInput {
        month: String!
        days: [DayInput]!
    }

    type Specialist {
        id: ID!
        username: String!
        password: String!
        avatar: String
        age: Int!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean!
        specialtys: [Specialty]
        world: World!
        monthlySchedule: [MonthlySchedule]!
        reviews: [Review]
        paymentOption: PaymentOption!
        completedAppointments: [Appointment]
        highlighted: Boolean!
    }

    input SpecialistInput {
        username: String!
        password: String!
        avatar: String
        age: Int!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean
        specialtys: [Specialty]
        world: World!
        monthlySchedule: [MonthlyScheduleInput]!
        reviews: [ReviewInput]
        paymentOption: PaymentOption!
        completedAppointments: [AppointmentInput]
        highlighted: Boolean
    }

    type Client {
        id: ID!
        username: String!
        password: String!
        avatar: String
        age: Int!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean!
        appointments: [Appointment]!
        favorites: [ID]!
        reviews: [Review]
    }

    input ClientInput {
        username: String!
        password: String!
        avatar: String
        age: Int!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean
        appointments: [AppointmentInput]!
        favorites: [ID]!
        reviews: [ReviewInput]
    }

    type Query {
        specialistCount: Int!
        findBySpecialtys(specialtys: [Specialty]): [Specialist]!
        findSpecialistByName(name: String!): Specialist
        getClient(id: ID!): Client
        getClients: [Client]
    }


    type Mutation {
        createSpecialist(input: SpecialistInput!): Specialist
        updateSpecialist(id: ID!, input: SpecialistInput!): Specialist
        deleteSpecialist(id: ID!): Specialist
        changeSpecialtys(name: String!, specialtys: [Specialty]): Specialist
        scheduleAppointment(
            specialistId: ID!
            month: String!
            day: String!
            newAppointment: AppointmentInput!
        ): Appointment
        createClient(input: ClientInput!): Client
        updateClient(id: ID!, input: ClientInput!): Client
        deleteClient(id: ID!): Client
    }
`;