import bcrypt from 'bcryptjs';
import { id, insert, load, migrate, resetStore } from './store.js';

if (process.argv.includes('--reset')) resetStore();
migrate();
const db = load();

const lessons = [
  ['Basic Keys', 'आधारभूत कुञ्जी', 'character', 'Beginner', 'क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण'],
  ['Matra Practice', 'मात्रा अभ्यास', 'character', 'Beginner', 'का कि की कु कू के कै को कौ कं कः'],
  ['Word Practice', 'शब्द अभ्यास', 'word', 'Intermediate', 'नेपाल हिमाल काठमाडौँ शिक्षा अभ्यास भाषा संस्कृति'],
  ['Sentence Practice', 'वाक्य अभ्यास', 'sentence', 'Intermediate', 'नेपाल हाम्रो सुन्दर देश हो । यहाँ विविधता मा एकता छ ।'],
  ['News Practice', 'समाचार अभ्यास', 'paragraph', 'Advanced', 'आज विद्यार्थीहरूले प्रविधिको प्रयोग गरेर नेपाली टाइपिङ अभ्यास गरिरहेका छन् । नियमित अभ्यासले गति र शुद्धता दुवै सुधार गर्छ ।'],
  ['Lok Sewa Style', 'लोक सेवा शैली', 'exam', 'Advanced', 'शुद्ध लेखन, समय व्यवस्थापन र निरन्तर अभ्यास राम्रो टाइपिङ सीपका मुख्य आधार हुन् ।']
];
for (const [title_en, title_ne, type, level, content] of lessons) {
  if (!db.lessons.some(l => l.title_en === title_en)) insert('lessons', { id: id('lesson'), title_en, title_ne, type, level, content });
}

const achievements = [
  ['WPM_30', '30 WPM', '३० WPM', 'Reached 30 words per minute', '३० शब्द प्रति मिनेट पुगेको', '⚡'],
  ['WPM_50', '50 WPM', '५० WPM', 'Reached 50 words per minute', '५० शब्द प्रति मिनेट पुगेको', '🚀'],
  ['ACC_90', '90% Accuracy', '९०% शुद्धता', 'Reached 90% accuracy', '९०% शुद्धता पुगेको', '🎯'],
  ['NO_ERROR', 'Error Free', 'गल्ती रहित', 'Completed a session without mistakes', 'गल्ती बिना अभ्यास पूरा भयो', '💎']
];
for (const [code, title_en, title_ne, description_en, description_ne, icon] of achievements) {
  if (!db.achievements.some(a => a.code === code)) insert('achievements', { id: id('ach'), code, title_en, title_ne, description_en, description_ne, icon });
}

if (!db.users.some(u => u.email === 'admin@preetifont.local')) {
  insert('users', {
    id: id('user'),
    name: 'Admin',
    email: 'admin@preetifont.local',
    password_hash: bcrypt.hashSync('admin123', 10),
    avatar_url: '',
    provider: 'email',
    role: 'admin',
    level: 'Advanced',
    daily_goal_minutes: 20,
    language: 'en',
    theme: 'light'
  });
}
console.log('Seed complete. Admin: admin@preetifont.local / admin123');
console.log('This version stores data in server/data/preeti_typing_data.json, so no SQLite or Visual Studio C++ build tools are needed.');
