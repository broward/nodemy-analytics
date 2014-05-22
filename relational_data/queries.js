"use strict";

var queries = {
  
  // Get org name from an organization id
  HostName: 'SELECT NAME FROM HOSTS WHERE ID = $1',

  // Get subhost ids and names for top-level host
  SubhostNames: 'SELECT S.SUBHOST_ID, H.NAME ' +
                ' FROM SUBHOSTS S, HOSTS H ' + 
                ' WHERE S.ID = H.ID ' + 
                ' AND HOST_ID = $1 ',

  // Get all subhosts of the host
  PeerHosts: 'SELECT S.SUBHOST_ID ' + 
             ' FROM SUBHOSTS SU ' + 
             ' LEFT OUTER JOIN SUBHOSTS S ' + 
             ' ON SU.HOSTS = S.HOST_ID ' +
             ' WHERE SU.SUBHOST_ID = $1',

  // Get median response time
  MedianResponseTime: " SELECT median(delta) AS median " + 
            " FROM (select (extract(epoch from gm.created_at)::bigint - " +
            " extract(epoch from g.created_at)::bigint) as delta " +
            " from group_members gm, groups g " + 
            " where g.id = gm.group_id " + 
            " and g.id = $1) as mediantable", 

  // Get median data for each host
  MedianData: " select distinct(g.id), g.title, count(*) as hosts " + 
          " from group_members gm, groups g " +
          " where gm.group_id = g.id " +
          " and g.id in " +
          " (select id " +
          " from groups) " +          
          " group by g.id " +
          " order by hosts ",

  // Overall activity by hostid
  ActivityByHostId: " SELECT D.EPOCH, COUNT(E.EPOCH) " +
          " FROM EVENTS E INNER JOIN DIM_DATE D " +
          " ON D.EPOCH = E.EPOCH " +
          " WHERE E.ORGID = $1 " +
          " GROUP BY D.EPOCH " +
          " ORDER BY D.EPOCH "
}

var prepared_statements = {}

Object.keys(queries).forEach(function(name){
  prepared_statements[name] = function(/* function arguments */){
    return {name: name, text: queries[name], values: [].slice.call(arguments)}
  }
})

module.exports = prepared_statements
