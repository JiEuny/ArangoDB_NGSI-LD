'use strict';
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
const joi = require('joi'); //imported from npm
const db = require('@arangodb').db;
const foxxColl = db._collection('myFoxxCollection');
const foxxEdgeColl = db._collection('myFoxxEdgeCollection');
const aql = require('@arangodb').aql;

// Registers the router with the Foxx service context
module.context.use(router);

// Basic Hello World route
router.get('/hello-world', function (req, res) {
    res.send('Hello World');
})
    .response(['text/plain'], 'A generic greeting.')
    .summary('Generic greeting')
    .description('Prints a generic greeting.');

// Route with parameter validation
router.get('/hello/:name', function (req, res) {
    res.send('Hello ${req.pathParams.name}');
})
    .pathParam('name', joi.string().required(), 'Name to greet.')
    .response(['text/plain'], 'A personalized greeting.')
    .summary('Personalized greeting')
    .description('Prints a personalized greeting.');

// Add entry to myFoxxCollection
router.post('/entries', function (req, res) {
    const data = req.body;
    const meta = foxxColl.save(req.body);
    res.send(Object.assign(data, meta));
})
    .body(joi.object().required(), 'Entry to store in the collection.')
    .response(joi.object().required(), 'Entry stored in the collection.')
    .summary('Store an entry.')
    .description('Stores and entry in "myFoxxCollection" collection.')

// Retrieve entry from myFoxxCollection using AQL
router.get('/entries', function (req, res) {
    const keys = db._query(aql`
        FOR entry IN ${foxxColl}
        RETURN entry._key
        `);
        res.send(keys);
})
    .response(joi.array().items(
        joi.string().required()
    ).required(), 'List of entry keys.')
    .summary('List entry keys')
    .description('Assembles a list of keys of entries in the collection.')

// get all
router.get('/foxx', function (req, res) {
    try {
        res.send(foxxColl.all())
    } catch(e) {
        res.send(e.toString())
    }
})

// get type
router.get('/type', function (req, res) {
    const types = db._query(aql`
        FOR entry IN ${foxxColl}
        RETURN entry.type
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})

// get type filter 'e'
router.get('/typese', function (req, res) {
    const types = db._query(aql`
        FOR doc IN ${foxxColl}
        RETURN (
            FOR name IN ATTRIBUTES(doc)
                FILTER LIKE(name, '%e%')
                RETURN {
                    name: name,
                    value: doc[name]
                }
        )
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})

// get attribute
router.get('/get-ngsi-att', function (req, res) {
    const types = db._query(aql`
        FOR doc IN ${foxxColl}
        LET att = (
            FOR name IN ATTRIBUTES(doc)
            RETURN {
                name: name,
                value: doc[name]
            }
        )
        RETURN ZIP(att[*].name, att[*].value)
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})

// get relationship
router.get('/get-ngsi-relationship', function (req, res) {
    const types = db._query(aql`
        FOR doc IN myFoxxCollection

        FOR name IN ATTRIBUTES(doc)
            FILTER LIKE(name, '%is%' OR '%By%')
            RETURN {
                relationship: name,
                key: doc[name].object
            }
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})

// second relationship
router.get('/get-second-ngsi-relationship', function (req, res) {
    const types = db._query(aql`
        FOR doc IN myFoxxCollection
        LET att = (
        FOR name IN ATTRIBUTES(doc)
                FILTER LIKE(name, '%is%' OR '%By%')
                RETURN doc[name]
        )
        
        FOR attdoc IN att
            FOR attname IN ATTRIBUTES(attdoc)
                FILTER LIKE(attname, '%By%')
                RETURN {
                    relationship: attname,
                    key: attdoc[attname].object
                }
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})


// add edge by key
router.get('/add-ngsi-edge-key', function (req, res) {
    const types = db._query(aql`
        FOR doc IN myFoxxCollection

        FOR name IN ATTRIBUTES(doc)
            FILTER LIKE(name, '%is%' OR '%By%')
            INSERT { 
                _from: doc._id, 
                _to: CONCAT('myFoxxCollection/', doc[name].object), 
                relationship: name,
                _key: name
            } INTO myFoxxEdgeCollection
            RETURN {
                id: doc._id,
                relationship: name,
                key: doc[name].object,
                test: CONCAT('myFoxxCollection/', doc[name].object)
            }
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})

// add edge by id
router.get('/add-ngsi-edge-id', function (req, res) {
    const types = db._query(aql`
    FOR doc IN myFoxxCollection

    FOR name IN ATTRIBUTES(doc)
        FILTER LIKE(name, '%is%' OR '%By%')
        LET toid = doc[name].object
        
    FOR to IN myFoxxCollection
    FILTER to.id == toid
        LET test = to._id
        
    INSERT { 
                    _from: doc._id, 
                    _to: to._id, 
                    relationship: name
                } INTO myFoxxEdgeCollection
    
                RETURN {
                    fromId: doc._id,
                    relationship: name,
                    toId: doc[name].object,
                    toKey: to._id
                }
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})

// csv to ngsi-ld data
router.get('/csv-to-ngsi', function (req, res) {
    const types = db._query(aql`
    FOR doc IN originCSV

    FOR att IN ATTRIBUTES(doc)
        FILTER LIKE(att, '%patient%')
        LET id = doc[att]
    FOR att1 IN ATTRIBUTES(doc)
        FILTER LIKE(att1, '%sex%')
        LET gender = doc[att1]
    FOR att2 IN ATTRIBUTES(doc)
        FILTER LIKE(att2, '%birth%')
        LET yearOfBirth = doc[att2]
    FOR att3 IN ATTRIBUTES(doc)
        FILTER LIKE(att3, '%region%')
        LET address = doc[att3]
    FOR att4 IN ATTRIBUTES(doc)
        FILTER LIKE(att4, '%group%')
        LET infectionBy_description = doc[att4]
    FOR att5 IN ATTRIBUTES(doc)
        FILTER LIKE(att5, '%reason%')
        LET infectionBy_relationship = doc[att5]
    FOR att8 IN ATTRIBUTES(doc)
        FILTER LIKE(att8, '%order%')
        LET orderOfTransmission = doc[att8]
    FOR att6 IN ATTRIBUTES(doc)
        FILTER LIKE(att6, '%by%')
        LET infectionBy_object = doc[att6]
    FOR att7 IN ATTRIBUTES(doc)
        FILTER LIKE(att7, '%state%')
        LET infectionStatus = doc[att7]
        
    INSERT {
        id: CONCAT("urn:covid-10:case:00", id),
        type: "InfectionCase",
        yearOfBirth: {
            type: "Property",
            value: yearOfBirth
        },
        address: {
            type: "Preperty",
            value: {
                addressCountry: "KR",
                addressRegion: address
            }
        },
        diseaseCode: {
            type: "Preperty",
            value: "COVID-19"
        },
        infectinStatus: {
            type: "Preperty",
            value: infectionStatus
        },
        orderOfTransmission: {
            type: "Preperty",
            value: orderOfTransmission
        },
        travelRoutes: {
            type: "Property",
            value: [
                {
                    placeName: "",
                    address: {
                        type: "Preperty",
                        value: {
                            addressCountry: "KR",
                            addressRegion: "",
                            addressLocality: "",
                            streetAddress: ""
                        }
                    },
                    location: {
                        type: "GeoProperty",
                        value: {
                            type: "Point",
                            coordinates: [
                                0,
                                0
                            ]
                        }
                    },
                    transport: "",
                    beginTime: "",
                    duration: 0
                },
                {
                    placeName: "",
                    address: {
                        type: "Preperty",
                        value: {
                            addressCountry: "KR",
                            addressRegion: "",
                            addressLocality: "",
                            streetAddress: ""
                        }
                    },
                    location: {
                        type: "GeoProperty",
                        value: {
                            type: "Point",
                            coordinates: [
                                0,
                                0
                            ]
                        }
                    },
                    transport: "",
                    beginTime: "",
                    duration: 0
                }
            ]
        },
        spreader: {
            type: "Relationship",
            object: CONCAT("urn:covid-10:case:00", infectionBy_object),
            spreaderInfo: {
                type: "Property",
                value: {
                    relationship: infectionBy_relationship,
                    description: infectionBy_description
                }
            }
        }
    } INTO patientJSON

    RETURN {
        id: id,
        gender: gender,
        yearOfBirth: yearOfBirth,
        address: address,
        infectionBy_description: infectionBy_description,
        infectionBy_relationship: infectionBy_relationship,
        orderOfTransmission: orderOfTransmission,
        infectionBy_object: infectionBy_object,
        infectionStatus: infectionStatus
    }
        `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})

// add edge from patient
router.get('/add-ngsi-patient-edge', function (req, res) {
    const types = db._query(aql`
        FOR doc IN patientJSON

        FOR name IN ATTRIBUTES(doc)
            FILTER LIKE(doc[name].type, '%Rel%')
            LET reladata = doc[name].object
            FILTER reladata != "urn:covid-10:case:00 "
            LET realdata = doc[name].object
            
        FOR to IN patientJSON
            FILTER to.id == reladata
        
        INSERT {
            _from: doc._id,
            _to: to._id,
            relationship: name,
            spreaderInfo: doc[name].spreaderInfo
        } INTO patientEdge
        
        RETURN {
            from: doc.id,
            rel: name,
            to: reladata,
            toKey: to._id,
            value: doc[name].spreaderInfo
        }
    `)
    try {
        res.send(types);
    } catch(e) {
        res.send(e.toString())
    }
})