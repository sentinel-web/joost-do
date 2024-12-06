import { Mongo } from "meteor/mongo";

const Todos_Collection = new Mongo.Collection("todos");

export default Todos_Collection;