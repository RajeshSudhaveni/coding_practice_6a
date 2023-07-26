const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// api 1
const convertdbStateObjToResponseObj = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT
        *
    FROM
        state ;`;
  const states = await database.all(getStatesQuery);
  response.send(
    states.map((eachState) => convertdbStateObjToResponseObj(eachState))
  );
});

// api 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT 
        *
    FROM 
        state
    WHERE 
        state_id = ${stateId} ; `;
  const state = await database.get(getStateQuery);
  response.send(convertdbStateObjToResponseObj(state));
});

module.exports = app;

// api 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `INSERT INTO 
        district ( district_name , state_id , cases ,cured , active , deaths  ) 
    VALUES 
       ( '${districtName}' , ${stateId} , ${cases} , ${cured} , ${active} , ${deaths} ) ;`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//api 4
const convertDistrictObjToResponseObj = (eachDistrict) => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT 
        *
    FROM 
        district 
  WHERE
      district_id = ${districtId} ;`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictObjToResponseObj(district));
});

// api 5
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM
        district 
     WHERE 
        district_id = ${districtId} ;`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

//api 6
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = ` UPDATE
              district
            SET
              district_name = '${districtName}' ,
              state_id = ${stateId} ,
              cases = ${cases} ,
              cured = ${cured} ,
              active = ${active} ,
              deaths = ${deaths} 
            WHERE
              district_id = ${districtId};`;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//api 7
const convertStatsObjtoResponseObj = (obj) => {
  return {
    totalCases: obj["SUM(cases)"],
    totalCured: obj["SUM(cured)"],
    totalActive: obj["SUM(active)"],
    totalDeaths: obj["SUM(deaths)"],
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT 
        SUM(cases),
        SUM(cured) ,
        SUM(active) ,
        SUM(deaths)
     FROM 
        district 
     WHERE 
        state_id = ${stateId} ;
    `;
  const stats = await database.get(getStatsQuery);
  response.send(convertStatsObjtoResponseObj(stats));
});

//api 8
const fun = (obj) => {
  return {
    stateName: obj.state_name,
  };
};

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `SELECT 
        state_id 
    FROM 
        district 
    WHERE 
        district_id = ${districtId} ;`;

  const stateId = await database.get(getStateIdQuery);
  const getStateNameQuery = `SELECT 
        state_name 
     FROM 
        state
    WHERE 
        state_id = ${stateId.state_id} ;`;
  const stateName = await database.get(getStateNameQuery);
  response.send(fun(stateName));
});
