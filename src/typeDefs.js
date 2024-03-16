const { gql } = require('apollo-server-express');

const typeDefs = gql`
    # GraphQL typedefs
    type Checkout {
        link: String!
    }

    input CheckoutInput {
        link: String!
    }

    type File{
        id: ID!
        alias: String
        tipo: String
        filename: String!
        path: String!
    }

    input FileInput {
        id: ID!
        userId: ID!
        alias: String!
        tipo: String!
        filename: String
        path: String
    }

    type Invoice {
        id: ID!
        merchant: String!
        email: String!
        country: Int!
        order: String!
        money: String!
        amount: String!
        description: String!
        language: String!
        expiration: String!
        iva: String!
        user_name: String!
        clientId: Client!
        specialistId: Specialist!
        date: String!
        status: String!
        checksum: String!
        link: String!
    }

    input InvoiceInput {
        merchant: String!
        email: String!
        country: Int!
        money: String!
        amount: String!
        description: String!
        language: String!
        expiration: String!
        iva: String!
        user_name: String!
        clientId: ID
        specialistId: ID
        date: String
        status: String
        checksum: String
        appointmentId: ID!
        link: CheckoutInput
    }

    type User {
        id: ID!
        username: String!
        password: String!
        avatar: String
        age: String!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean!
        files: [File]
        notifications: [Notification]
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
        age: String!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean
        files: [FileInput]
        notifications: [NotificationInput]
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
        serviceType: ServiceType!
        clientUsername: String!
        specialistUsername: String!
    }

    enum Status {
        waiting
        scheduled
        pending
        completed
    }

    enum World {
        Hombre
        Mujer
        Mascota
    }

    enum ServiceType {
        Domicilio
        Local
        Mixto
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
        serviceType: ServiceType!
    }

    type Slot {
        isSlotAvailable: Boolean!
        reason: String
    }

    input SlotInput {
        date: String!
        startTime: String!
        estimatedEndTime: String!
        clientId: ID
        specialistId: ID!
        serviceType: ServiceType!
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

    type WeeklySchedule {
        Monday: [TimeSlot]
        Tuesday: [TimeSlot]
        Wednesday: [TimeSlot]
        Thursday: [TimeSlot]
        Friday: [TimeSlot]
        Saturday: [TimeSlot]
        Sunday: [TimeSlot]
    }

    input WeeklyScheduleInput {
        Monday: [TimeSlotInput]
        Tuesday: [TimeSlotInput]
        Wednesday: [TimeSlotInput]
        Thursday: [TimeSlotInput]
        Friday: [TimeSlotInput]
        Saturday: [TimeSlotInput]
        Sunday: [TimeSlotInput]

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

    type Specialty {
        name: String!
        description: String!
        icon: String
        price: Float!
        time: String!
    }

    input SpecialtyInput {
        name: String!
        description: String!
        icon: String
        price: Float!
        time: String!
    }

    type Specialist {
        id: ID!
        username: String!
        password: String!
        avatar: String
        age: String!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean!
        specialtys: [Specialty]
        world: [World]!
        weeklySchedule: WeeklySchedule!
        reviews: [Review]
        paymentOption: PaymentOption
        appointments: [Appointment]
        highlighted: Boolean!
        serviceType: ServiceType!
        files: [File]
        accountNumber: String!
        notifications: [Notification]
        reject: Boolean!
    }

    input SpecialistInput {
        username: String!
        password: String!
        avatar: String
        age: String!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean
        specialtys: [SpecialtyInput]
        world: [World]!
        weeklySchedule: WeeklyScheduleInput!
        reviews: [ReviewInput]
        paymentOption: PaymentOption
        appointments: [AppointmentInput]
        highlighted: Boolean
        serviceType: ServiceType!
        accountNumber: String!
        notifications: [NotificationInput]
        reject: Boolean
    }

    input UpdateSpecialistInput {
        username: String
        avatar: String
        gender: String
        phone: String
        email: String
        city: String
        street: String
        role: Role
        active: Boolean
        specialtys: [SpecialtyInput]
        world: World
        weeklySchedule: WeeklyScheduleInput
        reviews: [ReviewInput]
        paymentOption: PaymentOption
        appointments: [AppointmentInput]
        highlighted: Boolean
        serviceType: ServiceType
        notifications: [NotificationInput]
        reject: Boolean
    }

    type Client {
        id: ID!
        username: String!
        password: String!
        avatar: String
        age: String!
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
        files: [File]
        notifications: [Notification]
    }

    input ClientInput {
        username: String!
        password: String!
        avatar: String
        age: String!
        gender: String!
        phone: String!
        email: String!
        city: String!
        street: String!
        role: Role!
        active: Boolean
        appointments: [AppointmentInput]
        favorites: [ID]
        reviews: [ReviewInput]
        files: [FileInput]
        notifications: [NotificationInput]
    }

    input UpdateClientInput {
        username: String
        avatar: String
        gender: String
        phone: String
        email: String
        city: String
        street: String
        role: Role
        active: Boolean
        appointments: [AppointmentInput]
        favorites: [ID]
        reviews: [ReviewInput]
        files: [FileInput]
        notifications: [NotificationInput]
    }

    type AuthPayload {
        value: String
    }

    type Notification {
        id: ID!
        sender: ID!
        recipient: ID!
        tipo: String!
        message: String!
        date: String!
    }

    input NotificationInput {
        sender: ID!
        recipient: ID!
        tipo: String!
        message: String!
    }

    type Query {
        specialistCount: Int!
        clientCount: Int!
        invoiceCount: Int!
        appointmentCount: Int!
        findSpecialists(specialtys: [SpecialtyInput], world: World, city: String, serviceType: ServiceType ): [Specialist]!
        findSpecialistByName(name: String!): Specialist
        getSpecialist(id: ID!): Specialist
        getClient(id: ID!): Client
        getClients: [Client]
        getAppointments: [Appointment]
        getInvoices: [Invoice]
        me: User
        getUser(id: ID!): User
    }


    type Mutation {
        login(username: String!, password: String!): AuthPayload
        createSpecialist(input: SpecialistInput!): Specialist
        createAppointment(input: AppointmentInput!): Appointment
        updateSpecialist(id: ID!, input: UpdateSpecialistInput!): Specialist
        updateClient(id: ID!, input: UpdateClientInput!): Client
        deleteSpecialist(id: ID!): Specialist
        deleteAppointment(id: ID!): Appointment
        changeSpecialtys(name: String!, specialtys: [SpecialtyInput]): Specialist
        scheduleAppointment(input: AppointmentInput!): Appointment
        createClient(input: ClientInput!): Client
        deleteClient(id: ID!): Client
        toggleSpecialistHighlight(id: ID!): Specialist
        toggleSpecialistActive(id: ID!): Specialist
        toggleReject(id: ID): Specialist
        createInvoice(invoice: InvoiceInput!): Invoice
        isSlotAvailable(input: SlotInput!): Slot
        setFileData(input: FileInput!): File
        sendNotification(input: NotificationInput!): Notification
        timeToPay(id: ID, order: String!, merchant: String!, checksum: String!): Boolean
    }
`;

module.exports = typeDefs;