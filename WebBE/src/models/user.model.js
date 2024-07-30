'use strict'
// key:  !dmbg install by Mongo snippets for Node-js 
const { model, Schema } = require('mongoose'); // Erase if already required

const DOCUMENT_NAME = "User";
const COLLECTION_NAME = "Users";
// Declare the Schema of the Mongo model    
const userSchema = new Schema({
    name:{
        type: String,
        trim: true,
        maxLength: 150,
    },
    email:{
        type: String,
        required: true,
        trim: true,
    },
    password:{
        type: String,
        required: true,
    },
    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    verify:{
        type: Schema.Types.Boolean,
        default: false
    },
    roles:{
        type: Array,
        default: []
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

//Export the model
module.exports = model(DOCUMENT_NAME, userSchema);