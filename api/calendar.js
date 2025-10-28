import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  try {
    // Récupérer tous les contrats
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    // Générer le fichier iCalendar
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Planning Interactif//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Planning Interactif',
      'X-WR-TIMEZONE:Europe/Paris',
    ];

    contracts.forEach(contract => {
      const startDate = new Date(contract.date);
      const endDate = new Date(contract.end_date);
      
      // Format de date iCalendar : YYYYMMDD
      const formatDate = (date) => {
        return date.toISOString().split('T')[0].replace(/-/g, '');
      };

      const dtStart = formatDate(startDate);
      const dtEnd = formatDate(new Date(endDate.getTime() + 86400000)); // +1 jour pour la fin

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${contract.id}@planning-interactif`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:${contract.name} - ${contract.person}`,
        `DESCRIPTION:Client: ${contract.client}\\nStatut: ${contract.status}\\nHoraires: ${contract.start_time} - ${contract.end_time}\\n${contract.description || ''}`,
        `STATUS:${contract.status === 'Terminé' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    // Envoyer la réponse
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename=calendar.ics');
    res.status(200).send(icsContent.join('\r\n'));

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du calendrier' });
  }
}