const mongoose = require("mongoose");
const { Specialist } = require("./models/Specialist.js");
const { Appointment } = require("./models/Appointment.js");
const { Client } = require("./models/Client.js");
const { User } = require("./models/User.js");
const { AuthenticationError, UserInputError } = require("apollo-server-express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const { Invoice } = require("./models/Invoice.js");
const crypto = require("crypto");
const { File } = require("./models/File.js");
const { Notification } = require("./models/Notifications.js");
const { error } = require("console");

const JWT_SECRET = 'NEVER_SHARE_THIS';

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

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const validatePasswords = async (currentPassword, newPassword) => {
    if (!newPassword) {
        throw new Error("Nueva clave no puede estar vacía");
    }

    if (currentPassword === newPassword) {
        throw new Error("Nueva clave debe ser diferente a la clave actual");
    }

    return newPassword;
};

const consultPayValida = async (order, merchant, checksum) => {
    const myHeaders = new Headers();
    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
    const response = await fetch(`https://api-test.payvalida.com/api/v3/porders/${order}?merchant=${merchant}&checksum=${checksum}`, requestOptions)
    const result = await response.json();
    // const result = await response.json();
    // throw new Error(JSON.stringify(result))

    return result;
}

const eliminacionPayValida = async (invoice, checksum) => {
    const myHeaders = new Headers();
    const requestOptions = {
        method: 'DELETE',
        headers: myHeaders,
        redirect: 'follow'
    };

    const response = await fetch(`https://api-test.payvalida.com/api/v3/porders/${invoice.order}?merchant=${invoice.merchant}&checksum=${checksum}`, requestOptions)
    const result = await response.json();

    return result;
}

const validateInvoiceState = async (invoice, checksum) => {
    // Esperar 5 minutos
    await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));

    if (invoice.status !== 'APROBADA') {
        // Eliminar la factura de la base de datos

        await Appointment.findByIdAndDelete(invoice.order);
        await Specialist.updateOne(
            { _id: invoice.specialistId.id },
            { $pull: { appointments: { _id: invoice.appointmentId } } }
        );
        await Client.updateOne(
            { _id: invoice.clientId.id },
            { $pull: { appointments: { _id: invoice.appointmentId } } }
        );

        const response = await eliminacionPayValida(invoice, checksum);

        invoice.status = response.DATA.Operation;
        await invoice.save();
    }
}

const resolvers = {
    Query: {
        specialistCount: async () => await Specialist.countDocuments(),
        clientCount: async () => await Client.countDocuments(),
        invoiceCount: async () => await Invoice.countDocuments(),
        appointmentCount: async () => await Appointment.countDocuments(),
        findClients: async () => await Client.find().sort('name'),
        findSpecialists: async (_, { specialtys }) => {
            if (!specialtys || specialtys.length === 0) {
                return Specialist.find();
            }

            return Specialist.find({ specialtys: { $in: specialtys } });
        },
        findSpecialistByName: (_, { name }) => Specialist.findOne({ name }),
        getSpecialist: async (root, args, context) => {
            // args.id contiene el ID del especialista que se quiere obtener
            const specialist = await Specialist.findById(args.id);
            if (!specialist) {
                throw new Error('Specialist not found');
            }
            return specialist;
        },

        getClient: async (root, args, context) => {
            // args.id contiene el ID del cliente que se quiere obtener
            const client = await Client.findById(args.id);
            if (!client) {
                throw new Error('Client not found', args.id);
            }
            return client;
        },
        getClients: async () => await Client.find(),
        getAppointments: async () => await Appointment.find(),
        getInvoices: async () => await Invoice.find(),
        me: async (root, args, context) => {
            return context.currentUser;
        },
        getUser: async (root, args, context) => {
            // args.id contiene el ID del cliente que se quiere obtener
            const user = await User.findById(args.id);
            if (!user) {
                throw new Error('User not found', args.id);
            }
            return user;
        },
        getNotificationsByRecipient: async (root, args, context) => {
            const notifications = await Notification.find({ recipient: args.id })
            if (!notifications) {
                throw new Error('User not found', args.id);
            }
            return notifications;
        },
        getNotificationsBySender: async (root, args, context) => {
            const notifications = await Notification.find({ sender: args.id })
            if (!notifications) {
                throw new Error('User not found', args.id);
            }
            return notifications;
        },
    },

    Mutation: {
        createSpecialist: async (_, { input }) => {
            const hashedPassword = await hashPassword(input.password);
            input.password = hashedPassword;
            const newSpecialist = Specialist.create(input).catch(error => {
                throw new UserInputError(error.message, {
                    invalidArgs: { input }
                })
            });
            return newSpecialist;
        },
        createClient: async (_, { input }) => {

            // Verificar si ya existe un cliente con el mismo nombre
            const existingClientName = await Client.findOne({ phone: input.phone });
            if (existingClientName) {
                throw new Error('Ya existe un cliente con este nombre');
            }
            // Verificar si ya existe un cliente con el mismo correo electrónico
            const existingClient = await Client.findOne({ email: input.email });
            if (existingClient) {
                throw new Error('Ya existe un cliente con este correo electrónico');
            }

            const existingClientNumber = await Client.findOne({ username: input.username });
            if (existingClientNumber) {
                throw new Error('Ya existe un cliente con este telefono');
            }

            input.password = await hashPassword(input.password);
            const newClient = await Client.create(input);
            return newClient;
        },
        updateSpecialist: async (_, { id, input }) => {
            return Specialist.findByIdAndUpdate(id, input, { new: true });
        },
        updateClient: async (_, { id, input }) => {
            return Client.findByIdAndUpdate(id, input, { new: true });
        },
        deleteSpecialist: async (_, { id }) => {
            const specialist = await Specialist.findById(id);
            await Appointment.findOneAndDelete({ specialistId: id })
            await Invoice.findOneAndDelete({ 'specialistId.username': specialist.username });
            await Notification.findOneAndDelete({ sender :id });
            await Notification.findOneAndDelete({ recipient :id });
            return Specialist.findByIdAndDelete(id);
        },
        deleteClient: async (_, { id }) => {
            const client = await Client.findById(id);
            await Appointment.findOneAndDelete({ clientId: id })
            await Invoice.findOneAndDelete({ 'clientId.username': client.username });
            await Notification.findOneAndDelete({ sender :id });
            await Notification.findOneAndDelete({ recipient :id });
            return Client.findByIdAndDelete(id);
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
            const { specialistId, date, startTime, estimatedEndTime, clientId, subject, detail, value, status, serviceType } = input;



            // Extrae el día de la semana de la fecha
            const dayOfWeek = new Date(input.date).getDay();

            // Mapea los números de los días de la semana a los nombres de los días
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            // Obtén el nombre del día de la semana correspondiente
            const dayName = daysOfWeek[dayOfWeek];

            const specialist = await Specialist.findById(specialistId);
            const client = await Client.findById(clientId);

            if (specialist.serviceType != serviceType && specialist.serviceType != 'Mixto') {
                throw new Error("Este especialista no ofrece este tipo de servicio");
            }

            if (!specialist) {
                throw new Error("Especialista no encontrado");
            }

            if (!client) {
                throw new Error("Cliente no encontrado");
            }

            const specialistUsername = specialist.username

            const clientUsername = client.username

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

            newAppointmentData.clientUsername = clientUsername
            newAppointmentData.specialistUsername = specialistUsername



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
        isSlotAvailable: async (_, { input }) => {
            const { specialistId, date, startTime, estimatedEndTime, serviceType } = input;

            // Extrae el día de la semana de la fecha
            const dayOfWeek = new Date(date).getDay();

            // Mapea los números de los días de la semana a los nombres de los días
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            // Obtén el nombre del día de la semana correspondiente
            const dayName = daysOfWeek[dayOfWeek];

            const specialist = await Specialist.findById(specialistId);

            if (!specialist) {
                return { isSlotAvailable: false, reason: `Especialista no encontrado` };
            }

            if (specialist.serviceType != serviceType && specialist.serviceType != 'Mixto') {
                return { isSlotAvailable: false, reason: `Este especialista no ofrece este tipo de servicio` };
            }

            // Usa el nombre del día para obtener el horario semanal correspondiente
            const weeklySchedule = specialist.weeklySchedule[dayName];

            if (!weeklySchedule) {
                return { isSlotAvailable: false, reason: `El especialista no trabaja los ${dayName}` };
            }

            const isSlotAvailable = weeklySchedule.some((timeSlot) => {
                const slotStart = convertTimeToMinutes(timeSlot.start);
                const slotEnd = convertTimeToMinutes(timeSlot.end);
                const appointmentStart = convertTimeToMinutes(startTime);
                const appointmentEnd = convertTimeToMinutes(estimatedEndTime);

                // Verificar si el nuevo horario está fuera de los horarios disponibles
                return appointmentStart >= slotStart && appointmentEnd <= slotEnd;
            });

            if (!isSlotAvailable) {
                return { isSlotAvailable: false, reason: 'El horario seleccionado no está disponible' };
            }

            const isTimeOccupied = specialist.appointments.some(
                (existingAppointment) => {
                    if (!existingAppointment.startTime || !existingAppointment.estimatedEndTime || !existingAppointment.date) {
                        return { isSlotAvailable: false, reason: "existingAppointment.startTime, existingAppointment.endTime o existingAppointment.date son undefined" };
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
                return { isSlotAvailable: false, reason: "El horario de la cita ya está ocupado" };
            }

            return { isSlotAvailable: true };
        },
        toggleSpecialistHighlight: async (_, { id }, context) => {
            const { currentUser } = context
            if (!currentUser) throw new AuthenticationError("not authenticated");
            if (currentUser.role !== 'admin') throw new AuthenticationError('solo para admins')
            const specialist = currentUser.role == 'admin' ? await Specialist.findById(id) : null
            if (specialist == null) {
                throw new Error('Specialist not found');
            }
            specialist.highlighted = !specialist.highlighted;
            await specialist.save();
            return specialist;
        },
        toggleSpecialistActive: async (_, { id }, context) => {
            const { currentUser } = context
            if (!currentUser) throw new AuthenticationError("not authenticated");
            if (currentUser.role !== 'admin') throw new AuthenticationError('solo para admins')
            const specialist = currentUser.role == 'admin' ? await Specialist.findById(id) : null
            if (specialist == null) {
                throw new Error('Specialist not found');
            }
            specialist.active = !specialist.active;
            await specialist.save();
            return specialist;
        },
        toggleReject: async (_, { id }, context) => {
            const { currentUser } = context
            if (!currentUser) throw new AuthenticationError("not authenticated");
            if (currentUser.role !== 'admin') throw new AuthenticationError('solo para admins')
            const specialist = currentUser.role == 'admin' ? await Specialist.findById(id) : null
            if (specialist == null) {
                throw new Error('Specialist not found');
            }
            specialist.reject = !specialist.reject;
            await specialist.save()
            return specialist;
        },
        login: async (root, args) => {
            let user = await Specialist.findOne({ username: args.username });

            if (!user) {
                user = await Client.findOne({ username: args.username });
                if (!user) {
                    user = await User.findOne({ username: args.username });
                    if (!user) {
                        throw new UserInputError("usuario no encontrado");
                    }
                }
            }

            const passwordCorrect = user === null
                ? false
                : await bcrypt.compare(args.password, user.password);

            if (!passwordCorrect) {
                throw new UserInputError("Credenciales erroneas");
            }

            const userForToken = {
                username: user.username,
                id: user._id,
            };

            return { value: jwt.sign(userForToken, JWT_SECRET) };
        },
        createInvoice: async (_, { invoice }) => {
            try {
                // Generar un ID único para el campo 'order' y eliminar los guiones
                invoice.order = invoice.appointmentId;
                const FIXED_HASH = '0dab1a0cd67bcf598fbbcacd59200199ebb0f3081d3a5d53187354d17b715fb83f15ffaa2578b388ba9fc15f7e25ecea327e10c725bc3a55742b3ff9db5209f3';

                // Generar el checksum
                const preHash = invoice.email + invoice.country + invoice.order + invoice.money + invoice.amount + FIXED_HASH;
                const checksum = crypto.createHash('sha512').update(preHash).digest('hex');

                const specialist = await Specialist.findById(invoice.specialistId);
                if (!specialist) {
                    throw new Error("Especialista no encontrado");
                }
                delete specialist.appointments
                delete specialist.password
                invoice.specialistId = specialist

                const client = await Client.findById(invoice.clientId);
                if (!client) {
                    throw new Error('Client not found', invoice.clientId);
                }
                delete client.appointments
                delete client.password
                invoice.clientId = client

                // Agregar el checksum al objeto invoice
                invoice.checksum = checksum;

                const myHeaders = {
                    "Content-Type": "application/json"
                };

                const requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: JSON.stringify(invoice),
                    redirect: 'follow'
                };

                const response = await fetch("https://api-test.payvalida.com/api/v3/porders", requestOptions);
                const result = await response.json();

                if (result.CODE === "0000") {
                    // throw new Error(JSON.stringify(result))
                    // Crear una nueva factura y guardarla en la base de datos
                    invoice.link = result.DATA.checkout;
                    const newInvoice = new Invoice(invoice);
                    await newInvoice.save();

                    // return { link: result.DATA.checkout };
                    return newInvoice;
                } else {
                    throw new Error(`Failed to create invoice: ${result.DESC}`);
                }
            } catch (error) {
                await Appointment.findByIdAndDelete(invoice.appointmentId);
                await Specialist.updateOne(
                    { _id: invoice.specialistId },
                    { $pull: { appointments: { _id: invoice.appointmentId } } }
                );
                await Client.updateOne(
                    { _id: invoice.clientId },
                    { $pull: { appointments: { _id: invoice.appointmentId } } }
                );
                throw error;
            }
        },
        deleteAppointment: async (_, { id }) => {
            const appointment = await Appointment.findById(id);
            if (!appointment) {
                throw new Error('Appointment not found');
            }
            await Appointment.findByIdAndDelete(id);
            await Specialist.updateOne(
                { _id: appointment.specialistId },
                { $pull: { appointments: { _id: id } } }
            );
            await Client.updateOne(
                { _id: appointment.clientId },
                { $pull: { appointments: { _id: id } } }
            );
            return appointment;
        },
        setFileData: async (_, { input }) => {
            const file = await File.findById(input.id);
            let user = await User.findById(input.userId);
            if (!file) {
                throw new Error('File not found');
            }
            if (!user) {
                user = await Specialist.findById(input.userId);
                if (!user) {
                    user = await Client.findById(input.userId);
                }
                if (!user) {
                    throw new Error('User not found');
                }
            }
            file.alias = input.alias;
            file.tipo = input.tipo;
            await file.save();
            user.files.push(file);
            await user.save();
            return file;
        },
        sendNotification: async (_, { input }) => {
            // const { sender, recipient, tipo, message } = input;
            let user = await User.findById(input.sender);
            if (!user) {
                user = await Specialist.findById(input.sender);
                if (!user) {
                    user = await Client.findById(input.sender);
                }
                if (!user) {
                    throw new Error('User not found');
                }
            }
            let user2 = await Client.findById(input.recipient);
            if (!user2) {
                user2 = await Specialist.findById(input.recipient);
                if (!user2) {
                    user2 = await User.findById(input.recipient); // Changed from Client to User
                }
                if (!user2) {
                    throw new Error('User not found');
                }
            }

            const notification = await Notification.create({ sender: input.sender, recipient: input.recipient, tipo: input.tipo, message: input.message });
            user.notifications.push(notification);
            await user.save();
            user2.notifications.push(notification);
            await user2.save();

            return notification;
        },
        timeToPay: async (_, { id, order, merchant }) => {
            const FIXED_HASH = '0dab1a0cd67bcf598fbbcacd59200199ebb0f3081d3a5d53187354d17b715fb83f15ffaa2578b388ba9fc15f7e25ecea327e10c725bc3a55742b3ff9db5209f3';
            const invoice = await Invoice.findById(id);
            const preHash = order + merchant + FIXED_HASH;
            const checksum = crypto.createHash('sha512').update(preHash).digest('hex');
            const response = await consultPayValida(order, merchant, checksum);
            console.log(response.DATA.STATE)
            // throw new Error(JSON.parse(JSON.stringify(response)))
            console.log(invoice)
            invoice.status = response.DATA.STATE;
            await invoice.save();

            await validateInvoiceState(invoice, checksum);

            return invoice.status === 'APROBADA';
        },
        messageToTrash: async (_, { id }) => {
            try {
                const notification = await Notification.findById(id);

                if (!notification) {
                    throw new Error('Notification not found');
                }

                notification.tipo = "Papelera";
                await notification.save();

                return notification;
            } catch (error) {
                // Manejar errores de manera apropiada
                throw new Error(`Failed to move notification to trash: ${error.message}`);
            }
        },
        deleteService: async (_, { id, serviceName }) => {
            try {
                const specialist = await Specialist.findById(id);
                if (!specialist) {
                    throw new UserInputError("Specialist not found", id);
                }

                // Filtrar el array de servicios para eliminar el servicio con el nombre dado
                specialist.specialtys = specialist.specialtys.filter(service => service.name !== serviceName);

                // Guardar los cambios en la base de datos
                await specialist.save();

                return specialist;


            } catch (error) {
                throw new Error(`Filed to find the specialist or missing data (deleteService), ${error.message}`);
            }
        },
        toggleServiceActive: async (_, { id, serviceName }) => {
            try {
                const specialist = await Specialist.findById(id);
                if (!specialist) {
                    throw new UserInputError("Specialist not found", id);
                }

                // Busca el servicio con el nombre dado y cambia su estado
                specialist.specialtys.forEach(service => {
                    if (service.name === serviceName) {
                        service.state = !service.state;
                    }
                });

                // Guarda los cambios en la base de datos
                await specialist.save();

                return specialist;
            } catch (error) {
                throw new Error(`Failed to find the specialist or missing data (toggleServiceActive), ${error.message}`);
            }
        },
        cancelAppointment: async (_, { id }, context) => {
            const { currentUser } = context

            try {
                const appointment = await Appointment.findById(id);
                if (!appointment) {
                    throw new Error("La cita no existe");
                }
                const invoice = await Invoice.findOne({ "order": id });
                if (!invoice) {
                    throw new Error(`no se ha encontrado la factura relacionada ${id}`)
                }

                const FIXED_HASH = '0dab1a0cd67bcf598fbbcacd59200199ebb0f3081d3a5d53187354d17b715fb83f15ffaa2578b388ba9fc15f7e25ecea327e10c725bc3a55742b3ff9db5209f3';
                const preHash = invoice.order + invoice.merchant + FIXED_HASH;
                const checksum = crypto.createHash('sha512').update(preHash).digest('hex');

                const response = await eliminacionPayValida(invoice, checksum);

                let user
                let user2
                let user3
                let notification
                let notification2

                if (currentUser.role == 'specialist') {
                    
                    user = await Specialist.findById(appointment.specialistId);
                    if (!user) {
                        throw new UserInputError(`El especialista asignado a esta cita no existe ${appointment.specialistId}`)
                    }
                    user2 = await Client.findById(appointment.clientId);
                    if (!user2) {
                        throw new UserInputError(`El cliente asignado a esta cita no existe ${appointment.clientId}`)
                    }
                    notification = await Notification.create({ sender: user.id, recipient: user2.id, tipo: 'cancelacion cita', message: `El especialista ha cancelado la cita del dia: ${appointment.date} con hora de inicio: ${appointment.startTime} y hora de finalizacion estimada: ${appointment.estimatedEndTime}.` });

                    user.notifications.push(notification);
                    await user.save();
                    user2.notifications.push(notification);
                    await user2.save();

                } else if (currentUser.role == 'client') {

                    user = await Client.findById(appointment.clientId);
                    user2 = await Specialist.findById(appointment.specialistId);
                    notification = await Notification.create({ sender: user.id, recipient: user2.id, tipo: 'cancelacion cita', message: `El cliente ha cancelado la cita del dia: ${appointment.date} con hora de inicio: ${appointment.startTime} y hora de finalizacion estimada: ${appointment.estimatedEndTime}.` });

                    user.notifications.push(notification);
                    await user.save();
                    user2.notifications.push(notification);
                    await user2.save();

                } else if (currentUser.role == 'admin') {

                    user = await User.findById(currentUser.id);
                    if (!user) {
                        throw new UserInputError(`El especialista asignado a esta cita no existe ${currentUser.id}`)
                    }
                    user2 = await Specialist.findById(appointment.specialistId);
                    user3 = await Client.findById(appointment.clientId);
                    notification = await Notification.create({ sender: user.id, recipient: user2.id, tipo: 'cancelacion cita', message: `El administrador ha cancelado la cita del dia: ${appointment.date} con hora de inicio: ${appointment.startTime} y hora de finalizacion estimada: ${appointment.estimatedEndTime}.` });
                    notification2 = await Notification.create({ sender: user.id, recipient: user3.id, tipo: 'cancelacion cita', message: `El administrador ha cancelado la cita del dia: ${appointment.date} con hora de inicio: ${appointment.startTime} y hora de finalizacion estimada: ${appointment.estimatedEndTime}.` });

                    user.notifications.push(notification);
                    await user.save();
                    user2.notifications.push(notification);
                    await user2.save();
                    user3.notifications.push(notification2);
                    await user3.save();

                }

                invoice.status = 'Cancelado';


                await Appointment.findByIdAndDelete(id);
                await Specialist.updateOne(
                    { _id: appointment.specialistId },
                    { $pull: { appointments: { _id: id } } }
                );
                await Client.updateOne(
                    { _id: appointment.clientId },
                    { $pull: { appointments: { _id: id } } }
                );
                await invoice.save();

                return appointment;
            } catch (error) {
                throw new Error(error.message)
            }
        }
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
module.exports = resolvers;