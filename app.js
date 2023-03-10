const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(-1);
  }
};

initializeDBAndServer();

//status
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//priority
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

//category
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

//priority & status
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//category & status
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

//category & priority
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const validStatus = ["TO DO", "IN PROGRESS", "DONE"];
const validPriority = ["HIGH", "MEDIUM", "LOW"];
const validCategory = ["WORK", "HOME", "LEARNING"];

//Get Todos by Status, Priority, Category
app.get("/todos/", async (request, response) => {
  const { priority, status, search_q = ""} = request.query;
  let getTodoQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM   
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.status = '${status}';
          `;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM 
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.priority = '${priority}';
          `;
      break;
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM 
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.priority = '${priority}'
              AND todo.status = '${status}';
          `;
      break;
    default:
      getTodoQuery = `
            SELECT 
              *
            FROM
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
          `;
  }
  const dbResponse = await db.all(getTodoQuery);
  const todoDetails = dbResponse.map((obj) => {
    return {
      id: obj.id,
      todo: obj.todo,
      priority: obj.priority,
      status: obj.status,
    };
  });
  response.send(todoDetails);
});

//Get Todo Based on ID API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodQuery = `
        SELECT 
          * 
        FROM
          todo
        WHERE 
          todo.id = ${todoId};
    `;
  const dbResponse = await db.get(getTodQuery);
  if (dbResponse === undefined) {
    response.send("Invalid Todo Id");
  } else {
    const todoDetails = [dbResponse].map((obj) => {
      return {
        id: obj.id,
        todo: obj.todo,
        priority: obj.priority,
        status: obj.status,
        // category: obj.category,
        // dueDate: obj.due_date,
      };
    });
    response.send(...todoDetails);
  }
});

//Create Todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority,status} = request.body;
  const addTodoQuery = `
  INSERT INTO
    todo(id, todo, priority, status)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//Update Todo based on Request API
app.put("/todos/:todoId/", async (request, response) => {
  const requestBody = request.body;
  const { todoId } = request.params;
  let updatedColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const originalTodoQuery = `
    SELECT 
      *
    FROM
      todo
    WHERE 
      id = ${todoId};
  `;
  const originalTodoDetails = await db.get(originalTodoQuery);
  console.log(originalTodoDetails);
  const {
    status = originalTodoDetails.status,
    priority = originalTodoDetails.priority,
    todo = originalTodoDetails.todo,
    // category = originalTodoDetails.category,
    // dueDate = originalTodoDetails.due_date,
  } = requestBody;

  const updateTodoQuery = `
    UPDATE 
      todo
    SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE 
      id = ${todoId};
  `;
  const dbResponse = await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

//Delete Todo API
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const removeTodoQuery = `
        DELETE FROM 
          todo
        WHERE 
          todo.id = ${todoId};
    `;
  const dbResponse = await db.run(removeTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;