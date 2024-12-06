import { Meteor } from "meteor/meteor";
import "/imports/api/Todos_Collection";
import Todos_Collection from "../imports/api/Todos_Collection";

Meteor.startup(async () => {
    Meteor.publish("todos", (filter, options) => {
        return Todos_Collection.find(filter, options);
    })

    Meteor.methods({
        "todos.insert": async (todo) => {
            if (typeof todo !== "object") throw new Meteor.Error("invalid-todo");
            return await Todos_Collection.insertAsync(todo);
        },
        "todos.update": async (id, todo) => {
            if (!id) throw new Meteor.Error("invalid-id");
            if (typeof id !== "string") throw new Meteor.Error("invalid-id");
            const before = await Todos_Collection.findOneAsync(id);
            if (!before) throw new Meteor.Error("not-found");
            if (typeof todo !== "object") throw new Meteor.Error("invalid-todo");
            return await Todos_Collection.updateAsync(id, { $set: todo });
        },
        "todos.delete": async (id) => {
            if (!id) throw new Meteor.Error("invalid-id");
            if (typeof id !== "string") throw new Meteor.Error("invalid-id");
            const todo = await Todos_Collection.findOneAsync(id);
            if (!todo) throw new Meteor.Error("not-found");
            return await Todos_Collection.removeAsync(id);
        },
        "todos.count": async (filter) => {
            if (typeof filter !== "object") throw new Meteor.Error("invalid-filter");
            return await Todos_Collection.find(filter).countAsync();
        }
    })
});