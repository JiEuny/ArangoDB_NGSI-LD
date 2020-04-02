'use strict';
const db = require('@arangodb').db;
const collectionName = 'myFoxxCollection';
const edgecollectionName = 'myFoxxEdgeCollection';
const ngsicollectionName = 'patientJSON';
const ngsiedgecollectionName = 'patientEdge';

if (!db._collection(collectionName)) {
    db._createDocumentCollection(collectionName);
}

if (!db._collection(edgecollectionName)) {
    db._createEdgeCollection(edgecollectionName);
}

if (!db._collection(ngsicollectionName)) {
    db._createDocumentCollection(ngsicollectionName);
}

if (!db._collection(ngsiedgecollectionName)) {
    db._createEdgeCollection(ngsiedgecollectionName);
}