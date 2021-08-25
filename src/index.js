const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => {
    return user.username === username;
  });

  if(!user) {
    return response.status(404).json({ error: 'User not found' });
  }
  request.user = user;

  return next();
}

function checksUserTaskExists(request, response, next) {
  const { id } = request.params;

  const task = request.user.todos.find(task => task.id === id);
  
  if(!task) {
    return response.status(404).json({error: 'Task not found'});
  }

  request.task = task;

  return next();
}

app.post('/users', (request, response) => {
  const {name, username} = request.body;

  const user = users.find(user => {
    return user.username === username;
  });

  if(user) {
    return response.status(400).json({ error: 'User already exists' });
  }

  const newUser = { 
    id: uuidv4(),
    name, 
    username, 
    todos: []
  }

  users.push(newUser);

  response.status(201).json(newUser);  
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const task = { 
    id: uuidv4(),
    title,
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date()
  }

  user.todos.push(task);

  return response.status(201).json(task);
});

app.put('/todos/:id', checksExistsUserAccount, checksUserTaskExists, (request, response) => {
  const { title, deadline } = request.body;
  const { user, task } = request;

  const updatedTask = {
    ...task,
    title,
    deadline: new Date(deadline),
  };

  user.todos.splice(task, 1, updatedTask);

  return response.json(updatedTask);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksUserTaskExists, (request, response) => {
  const { user, task } = request;

  const updatedTask = {
    ...task,
    done: true,
  };

  user.todos.splice(task, 1, updatedTask);

  return response.json(updatedTask);
});

app.delete('/todos/:id', checksExistsUserAccount, checksUserTaskExists, (request, response) => {
  const { user, task } = request;

  user.todos.splice(task, 1);

  return response.status(204).send();
});

module.exports = app;