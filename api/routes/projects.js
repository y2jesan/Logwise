import express from 'express';
import Project from '../models/Project.js';
import UserProject from '../models/UserProject.js';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all projects (user can only see projects they own or are assigned to)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get projects where user is owner
    const ownedProjects = await Project.find({ owner: userId });
    
    // Get projects where user is assigned
    const userProjects = await UserProject.find({ user: userId }).populate('project');
    const assignedProjects = userProjects
      .map(up => up.project)
      .filter(p => p !== null && p !== undefined); // Filter out null/undefined projects
    
    // Combine and deduplicate
    const allProjectIds = new Set([
      ...ownedProjects.map(p => p._id.toString()),
      ...assignedProjects.map(p => p._id.toString())
    ]);
    
    const projects = await Project.find({
      _id: { $in: Array.from(allProjectIds) }
    }).populate('owner', 'email');
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project by ID (must be owner or assigned)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const projectId = req.params.id;
    
    // Check if user is owner
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is owner or assigned
    const isOwner = project.owner.toString() === userId.toString();
    const isAssigned = await UserProject.findOne({ user: userId, project: projectId });
    
    if (!isOwner && !isAssigned) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const populatedProject = await Project.findById(projectId)
      .populate('owner', 'email');
    
    // Get assigned users
    const userProjects = await UserProject.find({ project: projectId })
      .populate('user', 'email role');
    
    res.json({
      ...populatedProject.toObject(),
      assignedUsers: userProjects.map(up => up.user)
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project (any authenticated user can create)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    const project = await Project.create({
      name,
      description: description || '',
      owner: req.user._id
    });
    
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'email');
    
    res.status(201).json(populatedProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project (only owner can update)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const projectId = req.params.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only project owner can update' });
    }
    
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { name, description },
      { new: true }
    ).populate('owner', 'email');
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project (only owner can delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only project owner can delete' });
    }
    
    // Delete all user-project associations
    await UserProject.deleteMany({ project: projectId });
    
    // Delete the project
    await Project.findByIdAndDelete(projectId);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Assign user to project (admin or owner only)
router.post('/:id/assign', authenticate, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is admin or owner
    const isAdmin = req.user.role === 'admin';
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Only admin or project owner can assign users' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already assigned
    const existing = await UserProject.findOne({ user: userId, project: projectId });
    if (existing) {
      return res.status(400).json({ error: 'User is already assigned to this project' });
    }
    
    // Create assignment
    const userProject = await UserProject.create({
      user: userId,
      project: projectId
    });
    
    const populated = await UserProject.findById(userProject._id)
      .populate('user', 'email role')
      .populate('project', 'name');
    
    res.status(201).json(populated);
  } catch (error) {
    console.error('Assign user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User is already assigned to this project' });
    }
    res.status(500).json({ error: 'Failed to assign user' });
  }
});

// Remove user from project (admin or owner only)
router.delete('/:id/assign/:userId', authenticate, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.params.userId;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is admin or owner
    const isAdmin = req.user.role === 'admin';
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Only admin or project owner can remove users' });
    }
    
    // Don't allow removing the owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }
    
    const userProject = await UserProject.findOneAndDelete({
      user: userId,
      project: projectId
    });
    
    if (!userProject) {
      return res.status(404).json({ error: 'User assignment not found' });
    }
    
    res.json({ message: 'User removed from project successfully' });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

// Get all users for assignment (admin only - to see all users)
router.get('/:id/users/available', authenticate, requireAdmin, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Get all users
    const allUsers = await User.find().select('email role');
    
    // Get already assigned users
    const assignedUserProjects = await UserProject.find({ project: projectId });
    const assignedUserIds = assignedUserProjects.map(up => up.user.toString());
    
    // Get project owner
    const project = await Project.findById(projectId);
    const ownerId = project.owner.toString();
    
    // Filter out assigned users and owner
    const availableUsers = allUsers.filter(
      user => !assignedUserIds.includes(user._id.toString()) && 
               user._id.toString() !== ownerId
    );
    
    res.json(availableUsers);
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({ error: 'Failed to fetch available users' });
  }
});

export default router;

