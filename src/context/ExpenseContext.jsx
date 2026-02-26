import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setExpenses([]);
            setLoading(false);
            return;
        }

        const expensesCollection = collection(db, 'expenses');
        let q;

        if (user.isAdmin) {
            q = query(expensesCollection);
        } else {
            q = query(expensesCollection, where('createdBy', '==', user.uid));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            const sorted = fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
            setExpenses(sorted);
            setLoading(false);
        }, (err) => {
            console.error("Expense listener error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addExpense = async (expense) => {
        if (!user) throw new Error("Auth required");
        const plainExpense = JSON.parse(JSON.stringify(expense));
        const docRef = await addDoc(collection(db, 'expenses'), {
            ...plainExpense,
            createdBy: user.uid,
            creatorEmail: user.email,
            creatorName: user.name,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    };

    const updateExpense = async (id, data) => {
        const ref = doc(db, 'expenses', String(id));
        await updateDoc(ref, JSON.parse(JSON.stringify(data)));
    };

    const deleteExpense = async (id) => {
        await deleteDoc(doc(db, 'expenses', String(id)));
    };

    const monthlyExpenses = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        return expenses
            .filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            })
            .reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [expenses]);

    return (
        <ExpenseContext.Provider value={{
            expenses,
            loading,
            addExpense,
            updateExpense,
            deleteExpense,
            monthlyExpenses
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};

export const useExpenses = () => {
    const context = useContext(ExpenseContext);
    if (context === undefined) {
        throw new Error('useExpenses must be used within an ExpenseProvider');
    }
    return context;
};
