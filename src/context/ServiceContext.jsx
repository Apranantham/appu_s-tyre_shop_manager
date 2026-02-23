import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';


const ServiceContext = createContext();

export const ServiceProvider = ({ children }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setServices([]);
            setLoading(false);
            return;
        }

        const servicesCollection = collection(db, 'service');

        const unsubscribe = onSnapshot(servicesCollection, (snapshot) => {
            const servicesData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            setServices(servicesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);


    const addService = async (service) => {
        try {
            await addDoc(collection(db, 'service'), {
                ...service,
                active: true,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error adding service:", error);
            throw error;
        }
    };

    const updateService = async (id, updatedData) => {
        try {
            const serviceRef = doc(db, 'service', id);
            await updateDoc(serviceRef, updatedData);
        } catch (error) {
            console.error("Error updating service:", error);
            throw error;
        }
    };

    const deleteService = async (id) => {
        try {
            await deleteDoc(doc(db, 'service', id));
        } catch (error) {
            console.error("Error deleting service:", error);
            throw error;
        }
    };

    const toggleService = async (id) => {
        try {
            const service = services.find(s => s.id === id);
            if (service) {
                const serviceRef = doc(db, 'service', id);
                await updateDoc(serviceRef, { active: !service.active });
            }
        } catch (error) {
            console.error("Error toggling service:", error);
            throw error;
        }
    };

    return (
        <ServiceContext.Provider value={{ services, addService, updateService, deleteService, toggleService, loading }}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (context === undefined) {
        throw new Error('useServices must be used within a ServiceProvider');
    }
    return context;
};
