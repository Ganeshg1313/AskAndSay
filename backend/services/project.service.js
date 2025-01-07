
import projectModel from '../models/project.model.js';
import mongoose from 'mongoose';

export const createProject = async ({name, userId}) => {
      
    if(!name){
        throw new Error('Name is required')
    }
      
    if(!userId){
        throw new Error('User is required')
    }

    try{
        const project = await projectModel.create({
            name, 
            users: [userId]
        })

        return project;

    }catch(error){
        if(error.code === 11000){
            throw new Error('Project name already exists');
        }
        throw new error;
    }
}

export const getAllProjectByUserId = async ({userId}) => {
    if(!userId){
        throw new Error('UserId is required');    
    }

    const allUserProjects = await projectModel.find({
        users: userId,
    })

    return allUserProjects;
}

export const addUsersToProject = async ({projectId, users, userId}) => {
    if(!projectId){
        throw new Error('ProjectId is required');
    }

    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error('Invalid projectId');
    }

    if(!users){
        throw new Error('Users is required');
    }

    if(!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))){
        throw new Error('Invalid userId(s) is users array');
    }

    if(!userId){
        throw new Error('UserId is required');
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new Error('Invalid userId');
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId,
    })

    if(!project){
        throw new Error('User not belong to this project');
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId,
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    }, {
        new: true
    }
    )

    return updatedProject;
}

export const getProject = async ({projectId}) => {
    if(!projectId){
        throw new Error('Project Id is required');
    }

    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error('Invalid projectId');
    }

    const project = projectModel.findOne({
        _id: projectId
    }).populate('users');

    return project;
}