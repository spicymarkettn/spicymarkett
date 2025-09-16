/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

const ADMIN_PASSWORD = "2086";

// --- Gemini API Setup ---
let ai;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

// --- React Components ---

const Spinner = () => (
    <div className="spinner-container">
        <div className="spinner"></div>
        <p>Generating our library...</p>
    </div>
);

const Header = ({ setView, isLoggedIn, setIsLoggedIn, setIsAdmin }) => {
    const handleSignOut = () => {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setView('home');
    };

    return (
        <header className="header">
            <div className="container">
                <h1 className="logo" onClick={() => setView('home')}>Gemini Books</h1>
                <nav>
                    {isLoggedIn ? (
                        <button onClick={handleSignOut} className="button-secondary">Sign Out</button>
                    ) : (
                        <>
                            <button onClick={() => setView('signin')} className="button-secondary">Sign In</button>
                            <button onClick={() => setView('signup')} className="button-primary">Sign Up</button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

// FIX: Added explicit types for BookCard props to resolve TypeScript error with the 'key' prop.
const BookCard = ({ book, isAdmin, onEdit, onDelete }: { book: any; isAdmin: boolean; onEdit: (book: any) => void; onDelete: (id: number) => void; }) => (
    <div className="book-card">
        <div className="book-cover" style={{ backgroundColor: book.coverColor || '#f0f0f0' }}>
            <div className="book-cover-title">{book.recipeName}</div>
            <div className="book-cover-author">{book.author}</div>
        </div>
        <div className="book-info">
            <h3>{book.recipeName}</h3>
            <p className="author">by {book.author}</p>
            <p className="description">{book.description}</p>
            <div className="card-footer">
                <p className="price">${book.price}</p>
                 {isAdmin && (
                    <div className="admin-actions">
                        <button onClick={() => onEdit(book)} className="edit-btn">Edit</button>
                        <button onClick={() => onDelete(book.id)} className="delete-btn">Delete</button>
                    </div>
                )}
            </div>
        </div>
    </div>
);


const BookForm = ({ book, onSave, onCancel }) => {
    const [formData, setFormData] = useState(book || { recipeName: '', author: '', description: '', price: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, price: parseFloat(formData.price) || 0 });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h2>{book ? 'Edit Book' : 'Add New Book'}</h2>
                <form onSubmit={handleSubmit}>
                    <input name="recipeName" value={formData.recipeName} onChange={handleChange} placeholder="Title" required />
                    <input name="author" value={formData.author} onChange={handleChange} placeholder="Author" required />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required />
                    <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" required />
                    <div className="modal-actions">
                        <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                        <button type="submit" className="button-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const HomePage = ({ books, isAdmin, setBooks }) => {
    const [editingBook, setEditingBook] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleSaveBook = (bookToSave) => {
        if (bookToSave.id) {
            setBooks(books.map(b => b.id === bookToSave.id ? bookToSave : b));
        } else {
            setBooks([...books, { ...bookToSave, id: Date.now(), coverColor: `#${Math.floor(Math.random()*16777215).toString(16)}` }]);
        }
        setEditingBook(null);
        setIsAdding(false);
    };

    const handleDeleteBook = (bookId) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            setBooks(books.filter(b => b.id !== bookId));
        }
    };

    return (
        <main className="container">
            <div className="hero">
                <h2>Discover Your Next Great Read</h2>
                <p>Explore a universe of stories, generated by Gemini.</p>
            </div>
             {isAdmin && (
                <div className="admin-bar">
                    <p>Admin Mode</p>
                    <button className="button-primary" onClick={() => setIsAdding(true)}>Add New Book</button>
                </div>
            )}
            <div className="book-grid">
                {books.map(book => (
                    <BookCard key={book.id} book={book} isAdmin={isAdmin} onEdit={setEditingBook} onDelete={handleDeleteBook} />
                ))}
            </div>
            {(isAdding || editingBook) && (
                <BookForm
                    book={editingBook}
                    onSave={handleSaveBook}
                    onCancel={() => { setEditingBook(null); setIsAdding(false); }}
                />
            )}
        </main>
    );
};

const AuthPage = ({ setView, setIsLoggedIn, isSignUp = false }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoggedIn(true);
        setView('home');
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
                <form onSubmit={handleSubmit}>
                    {isSignUp && <input type="text" placeholder="Your Name" required />}
                    <input type="email" placeholder="Email Address" required />
                    <input type="password" placeholder="Password" required />
                    <button type="submit" className="button-primary">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
                </form>
                <p>
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <a href="#" onClick={() => setView(isSignUp ? 'signin' : 'signup')}>
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </a>
                </p>
            </div>
        </div>
    );
};


const Footer = ({ setIsAdmin }) => {
    const handleAdminClick = () => {
        const password = prompt('Enter admin password:');
        if (password === ADMIN_PASSWORD) {
            alert('Admin access granted!');
            setIsAdmin(true);
        } else if (password) {
            alert('Incorrect password.');
        }
    };
    return (
        <footer className="footer">
            <div className="container">
                <p>&copy; 2024 Gemini Books. All rights reserved.</p>
                <p><a href="#" onClick={handleAdminClick}>Admin Access</a></p>
            </div>
        </footer>
    );
};


const App = () => {
    const [view, setView] = useState('home');
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchBooks = useCallback(async () => {
        if (!ai) {
            setError("The AI service is not available.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: "Generate a list of 12 fictional e-book titles, authors, brief one-sentence descriptions, and prices for a fantasy and sci-fi bookstore.",
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                recipeName: { type: Type.STRING, description: 'The title of the book.' },
                                author: { type: Type.STRING, description: 'The name of the author.' },
                                description: { type: Type.STRING, description: 'A short, one-sentence description.' },
                                price: { type: Type.NUMBER, description: 'The price of the book.' },
                            },
                            required: ["recipeName", "author", "description", "price"]
                        },
                    },
                },
            });

            const jsonStr = response.text.trim();
            const generatedBooks = JSON.parse(jsonStr);
            
            setBooks(generatedBooks.map((book, index) => ({
                ...book,
                id: Date.now() + index,
                coverColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
            })));
            
        } catch (err) {
            console.error("Error fetching books:", err);
            setError("Failed to generate the book library. Please try refreshing the page.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    const renderView = () => {
        if (isLoading) return <Spinner />;
        if (error) return <div className="container error-message">{error}</div>;

        switch (view) {
            case 'signin':
                return <AuthPage setView={setView} setIsLoggedIn={setIsLoggedIn} />;
            case 'signup':
                return <AuthPage setView={setView} setIsLoggedIn={setIsLoggedIn} isSignUp />;
            case 'home':
            default:
                return <HomePage books={books} isAdmin={isAdmin} setBooks={setBooks} />;
        }
    };

    return (
        <div className="app-wrapper">
            <Header setView={setView} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
            {renderView()}
            <Footer setIsAdmin={setIsAdmin} />
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
