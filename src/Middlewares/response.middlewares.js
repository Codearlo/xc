const convert = require('xml-js');

// Middleware para formatear la respuesta según el formato solicitado (JSON o XML)
exports.responseFormat = (req, res, next) => {
  // Guardar la función original res.json
  const originalJson = res.json;
  
  // Sobrescribir la función res.json
  res.json = function(data) {
    // Verificar si el cliente solicitó XML
    const acceptHeader = req.headers.accept;
    
    if (acceptHeader && acceptHeader.includes('application/xml')) {
      // Convertir a XML
      const options = { compact: true, ignoreComment: true, spaces: 4 };
      const xml = convert.json2xml(JSON.stringify(data), options);
      
      // Enviar respuesta XML
      res.header('Content-Type', 'application/xml');
      return res.send(xml);
    }
    
    // Enviar respuesta JSON (comportamiento predeterminado)
    res.header('Content-Type', 'application/json');
    return originalJson.call(this, data);
  };
  
  next();
};