<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, X, Eye, Edit2, Trash2, LogOut, LogIn } from 'lucide-react';
import { supabase } from './supabaseClient';

const App = () => {
  const [contracts, setContracts] = useState([]);
  const [view, setView] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState(9);
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    endDate: '',
    person: '',
    startTime: '',
    endTime: '',
    status: 'Planifié',
    description: '',
    client: ''
  });

  const statusColors = {
    'Planifié': 'bg-blue-100 text-blue-800 border-blue-300',
    'En cours': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Terminé': 'bg-green-100 text-green-800 border-green-300',
    'En attente': 'bg-gray-100 text-gray-800 border-gray-300',
    'Annulé': 'bg-red-100 text-red-800 border-red-300'
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchContracts();
      }
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await fetchContracts();
    }
    setLoading(false);
  };

  const fetchContracts = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching contracts:', error);
    } else {
      setContracts(data || []);
    }
  };

  const handleSignUp = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      setAuthError(error.message);
    } else {
      alert('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
    }
  };

  const handleSignIn = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setContracts([]);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      date: '',
      endDate: '',
      person: '',
      startTime: '',
      endTime: '',
      status: 'Planifié',
      description: '',
      client: ''
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleEdit = (contract) => {
    setFormData({
      id: contract.id,
      name: contract.name,
      date: contract.date,
      endDate: contract.end_date,
      person: contract.person,
      startTime: contract.start_time,
      endTime: contract.end_time,
      status: contract.status,
      description: contract.description || '',
      client: contract.client
    });
    setEditMode(true);
    setShowModal(true);
    setSelectedContract(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      
      if (error) {
        alert('Erreur lors de la suppression');
      } else {
        setContracts(contracts.filter(c => c.id !== id));
        setSelectedContract(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.endDate || !formData.person || !formData.startTime || !formData.endTime || !formData.client) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (new Date(formData.endDate) < new Date(formData.date)) {
      alert('La date de fin doit être postérieure ou égale à la date de début');
      return;
    }
    
    const contractData = {
      name: formData.name,
      date: formData.date,
      end_date: formData.endDate,
      person: formData.person,
      start_time: formData.startTime,
      end_time: formData.endTime,
      status: formData.status,
      description: formData.description,
      client: formData.client,
      user_id: user.id
    };

    if (editMode) {
      const { error } = await supabase
        .from('contracts')
        .update(contractData)
        .eq('id', formData.id);
      
      if (error) {
        alert('Erreur lors de la modification');
      } else {
        await fetchContracts();
      }
    } else {
      const { error } = await supabase
        .from('contracts')
        .insert([contractData]);
      
      if (error) {
        alert('Erreur lors de la création');
      } else {
        await fetchContracts();
      }
    }
    setShowModal(false);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getContractsForDate = (day, month, year) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return contracts.filter(c => {
      const startDate = new Date(c.date);
      const endDate = new Date(c.end_date);
      const currentDate = new Date(dateStr);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  const renderCalendarMonth = (monthIndex) => {
    const daysInMonth = getDaysInMonth(monthIndex, currentYear);
    const firstDay = getFirstDayOfMonth(monthIndex, currentYear);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-24 border border-gray-200 bg-gray-50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayContracts = getContractsForDate(day, monthIndex, currentYear);
      days.push(
        <div key={day} className="min-h-24 border border-gray-200 p-1 bg-white hover:bg-gray-50 transition">
          <div className="font-semibold text-sm text-gray-700 mb-1">{day}</div>
          <div className="space-y-1">
            {dayContracts.map(contract => (
              <div
                key={contract.id}
                onClick={() => setSelectedContract(contract)}
                className={`text-xs p-1 rounded cursor-pointer truncate ${statusColors[contract.status]}`}
                title={`${contract.name} - ${contract.person}`}
              >
                {contract.name}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Planning Interactif</h1>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                authMode === 'login' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                authMode === 'signup' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Inscription
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <button
              onClick={authMode === 'login' ? handleSignIn : handleSignUp}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              <LogIn size={20} />
              {authMode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Planning Interactif</h1>
            <div className="flex gap-3 items-center flex-wrap">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => setView(view === 'calendar' ? 'overview' : view === 'overview' ? 'detailed' : 'calendar')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Eye size={18} />
                {view === 'overview' ? 'Vue détaillée' : view === 'detailed' ? 'Vue calendrier' : 'Vue d\'ensemble'}
              </button>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus size={18} />
                Nouveau contrat
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total contrats</p>
              <p className="text-2xl font-bold text-blue-600">{contracts.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">
                {contracts.filter(c => c.status === 'En cours').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Terminés</p>
              <p className="text-2xl font-bold text-green-600">
                {contracts.filter(c => c.status === 'Terminé').length}
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Planifiés</p>
              <p className="text-2xl font-bold text-indigo-600">
                {contracts.filter(c => c.status === 'Planifié').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {view === 'overview' ? 'Vue d\'ensemble' : view === 'detailed' ? 'Vue détaillée' : `Calendrier ${currentYear}`}
          </h2>
          
          {view === 'calendar' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handlePreviousMonth}
                  disabled={currentYear === 2025 && currentMonth === 9}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Précédent
                </button>
                <h3 className="text-2xl font-bold text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <button
                  onClick={handleNextMonth}
                  disabled={currentYear === 2099 && currentMonth === 11}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Suivant →
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-0 border-2 border-gray-300">
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Lun</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Mar</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Mer</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Jeu</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Ven</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Sam</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Dim</div>
                {renderCalendarMonth(currentMonth)}
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Légende des statuts :</h4>
                <div className="flex flex-wrap gap-3">
                  {Object.keys(statusColors).map(status => (
                    <div key={status} className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status]}`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : view === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts.map(contract => (
                <div
                  key={contract.id}
                  onClick={() => setSelectedContract(contract)}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer hover:border-indigo-400"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800">{contract.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[contract.status]}`}>
                      {contract.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-600" />
                      <span>
                        {new Date(contract.date).toLocaleDateString('fr-FR')}
                        {contract.date !== contract.end_date && (
                          <> → {new Date(contract.end_date).toLocaleDateString('fr-FR')}</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-indigo-600" />
                      <span>{contract.start_time} - {contract.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-indigo-600" />
                      <span>{contract.person}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-3 text-left font-semibold text-gray-700">Contrat</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Date début</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Date fin</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Horaires</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Personne</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Client</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Statut</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(contract => (
                    <tr key={contract.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {contract.name}
                        </button>
                      </td>
                      <td className="p-3">{new Date(contract.date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">{new Date(contract.end_date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">{contract.start_time} - {contract.end_time}</td>
                      <td className="p-3">{contract.person}</td>
                      <td className="p-3">{contract.client}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[contract.status]}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(contract)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedContract.name}</h2>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="text-indigo-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Période</p>
                  <p className="font-semibold">
                    {new Date(selectedContract.date).toLocaleDateString('fr-FR')}
                    {selectedContract.date !== selectedContract.end_date && (
                      <> → {new Date(selectedContract.end_date).toLocaleDateString('fr-FR')}</>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="text-indigo-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Horaires</p>
                  <p className="font-semibold">{selectedContract.start_time} - {selectedContract.end_time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="text-indigo-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Personne responsable</p>
                  <p className="font-semibold">{selectedContract.person}</p>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Client</p>
                <p className="font-semibold">{selectedContract.client}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[selectedContract.status]}`}>
                  {selectedContract.status}
                </span>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-800">{selectedContract.description}</p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleEdit(selectedContract)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit2 size={18} />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(selectedContract.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={18} />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editMode ? 'Modifier le contrat' : 'Nouveau contrat'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du contrat *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Projet Alpha"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Planifié">Planifié</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="En attente">En attente</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de début *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de fin *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personne responsable *
                </label>
                <input
                  type="text"
                  value={formData.person}
                  onChange={(e) => handleInputChange('person', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Marie Dupont"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Entreprise XYZ"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Description du projet..."
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {editMode ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
=======
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, X, Eye, Edit2, Trash2, LogOut, LogIn } from 'lucide-react';
import { supabase } from './supabaseClient';

const App = () => {
  const [contracts, setContracts] = useState([]);
  const [view, setView] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState(9);
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    endDate: '',
    person: '',
    startTime: '',
    endTime: '',
    status: 'Planifié',
    description: '',
    client: ''
  });

  const statusColors = {
    'Planifié': 'bg-blue-100 text-blue-800 border-blue-300',
    'En cours': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Terminé': 'bg-green-100 text-green-800 border-green-300',
    'En attente': 'bg-gray-100 text-gray-800 border-gray-300',
    'Annulé': 'bg-red-100 text-red-800 border-red-300'
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchContracts();
      }
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await fetchContracts();
    }
    setLoading(false);
  };

  const fetchContracts = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching contracts:', error);
    } else {
      setContracts(data || []);
    }
  };

  const handleSignUp = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      setAuthError(error.message);
    } else {
      alert('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
    }
  };

  const handleSignIn = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setContracts([]);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      date: '',
      endDate: '',
      person: '',
      startTime: '',
      endTime: '',
      status: 'Planifié',
      description: '',
      client: ''
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleEdit = (contract) => {
    setFormData({
      id: contract.id,
      name: contract.name,
      date: contract.date,
      endDate: contract.end_date,
      person: contract.person,
      startTime: contract.start_time,
      endTime: contract.end_time,
      status: contract.status,
      description: contract.description || '',
      client: contract.client
    });
    setEditMode(true);
    setShowModal(true);
    setSelectedContract(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      
      if (error) {
        alert('Erreur lors de la suppression');
      } else {
        setContracts(contracts.filter(c => c.id !== id));
        setSelectedContract(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.endDate || !formData.person || !formData.startTime || !formData.endTime || !formData.client) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (new Date(formData.endDate) < new Date(formData.date)) {
      alert('La date de fin doit être postérieure ou égale à la date de début');
      return;
    }
    
    const contractData = {
      name: formData.name,
      date: formData.date,
      end_date: formData.endDate,
      person: formData.person,
      start_time: formData.startTime,
      end_time: formData.endTime,
      status: formData.status,
      description: formData.description,
      client: formData.client,
      user_id: user.id
    };

    if (editMode) {
      const { error } = await supabase
        .from('contracts')
        .update(contractData)
        .eq('id', formData.id);
      
      if (error) {
        alert('Erreur lors de la modification');
      } else {
        await fetchContracts();
      }
    } else {
      const { error } = await supabase
        .from('contracts')
        .insert([contractData]);
      
      if (error) {
        alert('Erreur lors de la création');
      } else {
        await fetchContracts();
      }
    }
    setShowModal(false);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getContractsForDate = (day, month, year) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return contracts.filter(c => {
      const startDate = new Date(c.date);
      const endDate = new Date(c.end_date);
      const currentDate = new Date(dateStr);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  const renderCalendarMonth = (monthIndex) => {
    const daysInMonth = getDaysInMonth(monthIndex, currentYear);
    const firstDay = getFirstDayOfMonth(monthIndex, currentYear);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-24 border border-gray-200 bg-gray-50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayContracts = getContractsForDate(day, monthIndex, currentYear);
      days.push(
        <div key={day} className="min-h-24 border border-gray-200 p-1 bg-white hover:bg-gray-50 transition">
          <div className="font-semibold text-sm text-gray-700 mb-1">{day}</div>
          <div className="space-y-1">
            {dayContracts.map(contract => (
              <div
                key={contract.id}
                onClick={() => setSelectedContract(contract)}
                className={`text-xs p-1 rounded cursor-pointer truncate ${statusColors[contract.status]}`}
                title={`${contract.name} - ${contract.person}`}
              >
                {contract.name}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Planning Interactif</h1>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                authMode === 'login' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                authMode === 'signup' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Inscription
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <button
              onClick={authMode === 'login' ? handleSignIn : handleSignUp}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              <LogIn size={20} />
              {authMode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Planning Interactif</h1>
            <div className="flex gap-3 items-center flex-wrap">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => setView(view === 'calendar' ? 'overview' : view === 'overview' ? 'detailed' : 'calendar')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Eye size={18} />
                {view === 'overview' ? 'Vue détaillée' : view === 'detailed' ? 'Vue calendrier' : 'Vue d\'ensemble'}
              </button>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus size={18} />
                Nouveau contrat
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total contrats</p>
              <p className="text-2xl font-bold text-blue-600">{contracts.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">
                {contracts.filter(c => c.status === 'En cours').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Terminés</p>
              <p className="text-2xl font-bold text-green-600">
                {contracts.filter(c => c.status === 'Terminé').length}
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Planifiés</p>
              <p className="text-2xl font-bold text-indigo-600">
                {contracts.filter(c => c.status === 'Planifié').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {view === 'overview' ? 'Vue d\'ensemble' : view === 'detailed' ? 'Vue détaillée' : `Calendrier ${currentYear}`}
          </h2>
          
          {view === 'calendar' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handlePreviousMonth}
                  disabled={currentYear === 2025 && currentMonth === 9}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Précédent
                </button>
                <h3 className="text-2xl font-bold text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <button
                  onClick={handleNextMonth}
                  disabled={currentYear === 2099 && currentMonth === 11}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Suivant →
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-0 border-2 border-gray-300">
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Lun</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Mar</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Mer</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Jeu</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Ven</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Sam</div>
                <div className="bg-indigo-600 text-white font-bold p-2 text-center">Dim</div>
                {renderCalendarMonth(currentMonth)}
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Légende des statuts :</h4>
                <div className="flex flex-wrap gap-3">
                  {Object.keys(statusColors).map(status => (
                    <div key={status} className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status]}`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : view === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts.map(contract => (
                <div
                  key={contract.id}
                  onClick={() => setSelectedContract(contract)}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer hover:border-indigo-400"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800">{contract.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[contract.status]}`}>
                      {contract.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-600" />
                      <span>
                        {new Date(contract.date).toLocaleDateString('fr-FR')}
                        {contract.date !== contract.end_date && (
                          <> → {new Date(contract.end_date).toLocaleDateString('fr-FR')}</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-indigo-600" />
                      <span>{contract.start_time} - {contract.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-indigo-600" />
                      <span>{contract.person}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-3 text-left font-semibold text-gray-700">Contrat</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Date début</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Date fin</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Horaires</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Personne</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Client</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Statut</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(contract => (
                    <tr key={contract.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {contract.name}
                        </button>
                      </td>
                      <td className="p-3">{new Date(contract.date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">{new Date(contract.end_date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">{contract.start_time} - {contract.end_time}</td>
                      <td className="p-3">{contract.person}</td>
                      <td className="p-3">{contract.client}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[contract.status]}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(contract)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedContract.name}</h2>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="text-indigo-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Période</p>
                  <p className="font-semibold">
                    {new Date(selectedContract.date).toLocaleDateString('fr-FR')}
                    {selectedContract.date !== selectedContract.end_date && (
                      <> → {new Date(selectedContract.end_date).toLocaleDateString('fr-FR')}</>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="text-indigo-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Horaires</p>
                  <p className="font-semibold">{selectedContract.start_time} - {selectedContract.end_time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="text-indigo-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Personne responsable</p>
                  <p className="font-semibold">{selectedContract.person}</p>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Client</p>
                <p className="font-semibold">{selectedContract.client}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[selectedContract.status]}`}>
                  {selectedContract.status}
                </span>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-800">{selectedContract.description}</p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleEdit(selectedContract)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit2 size={18} />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(selectedContract.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={18} />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editMode ? 'Modifier le contrat' : 'Nouveau contrat'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du contrat *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Projet Alpha"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Planifié">Planifié</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="En attente">En attente</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de début *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de fin *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personne responsable *
                </label>
                <input
                  type="text"
                  value={formData.person}
                  onChange={(e) => handleInputChange('person', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Marie Dupont"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Entreprise XYZ"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Description du projet..."
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {editMode ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
>>>>>>> 074265f797e4461365628c75517b4bc12a5cf346
                