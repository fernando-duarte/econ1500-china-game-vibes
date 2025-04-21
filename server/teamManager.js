/**
 * Team Manager Module
 * Handles team registration and student validation
 */
const fs = require('fs');
const path = require('path');
const CONSTANTS = require('../shared/constants');

// In-memory store of teams and their members
const teams = {}; // Reset on server restart
let studentList = [];

/**
 * Load student names from file
 * @param {string} filePath - Path to the student list file
 * @returns {Array} - Array of student names
 */
function loadStudentList(filePath = path.join(__dirname, '../data/students.txt')) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    studentList = data.split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    console.log(`Loaded ${studentList.length} students from file`);
    return studentList;
  } catch (error) {
    console.error('Error loading student list:', error);
    return [];
  }
}

/**
 * Register a new team with student members
 * @param {string} teamName - Team name
 * @param {Array} studentNames - Array of selected student names
 * @returns {Object} - Result object with success flag and team data or error
 */
function registerTeam(teamName, studentNames) {
  // Validate team name
  if (!teamName || typeof teamName !== 'string' || teamName.trim().length === 0) {
    return { success: false, error: 'Invalid team name' };
  }

  // Check if team name already exists
  if (teams[teamName]) {
    return { success: false, error: 'Team name already taken' };
  }

  // Validate student names against the loaded list
  const invalidStudents = studentNames.filter(name => !studentList.includes(name));
  if (invalidStudents.length > 0) {
    return {
      success: false,
      error: `Invalid student names: ${invalidStudents.join(', ')}`
    };
  }

  // Create and store the team
  teams[teamName] = {
    name: teamName,
    students: studentNames,
    createdAt: Date.now()
  };

  console.log(`Team registered: ${teamName} with ${studentNames.length} students`);

  return {
    success: true,
    team: teams[teamName]
  };
}

/**
 * Get all registered teams
 * @returns {Object} - Object containing all teams
 */
function getTeams() {
  return teams;
}

/**
 * Get available student list
 * @returns {Array} - Array of student names
 */
function getStudentList() {
  return studentList;
}

/**
 * Get a specific team by name
 * @param {string} teamName - Team name to look up
 * @returns {Object|null} - Team object or null if not found
 */
function getTeam(teamName) {
  return teams[teamName] || null;
}

/**
 * Clear all teams
 * @returns {boolean} - Success flag
 */
function clearTeams() {
  // Clear the teams object
  Object.keys(teams).forEach(key => delete teams[key]);
  console.log('All teams have been cleared');
  return true;
}

module.exports = {
  loadStudentList,
  registerTeam,
  getTeams,
  getStudentList,
  getTeam,
  clearTeams
};
