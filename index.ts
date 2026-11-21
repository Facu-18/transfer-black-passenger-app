// La tarea de la push silenciosa del seguimiento se define antes que expo-router:
// con la app cerrada, expo-task-manager carga este bundle sin montar ninguna
// pantalla y necesita encontrarla registrada (ver live-update-task.ts).
import './src/presentation/notifications/live-update-task';
import 'expo-router/entry';
