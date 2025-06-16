const { default: axios } = require("axios");
const jwt = require("jsonwebtoken");

const blacklist = new Set();

const signToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const authenticateToken = async (req, res, next) => {
  try {
    const authHeaer = req.headers["authorization"];
    const token = authHeaer && authHeaer.split(" ")[1];
    if (token === null) {
      return res.status(403).json({
        message: "Không có token",
        success: false,
      });
    }
    if (blacklist.has(token)) {
      return res.status(403).json({
        message: "Token đã hết hạn",
        success: false,
      });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          message: "Token không hợp lệ hoặc đã hết hạn",
          success: false,
        });
      }

      req.user = decoded;

      next();
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Truy cập bị từ chối. Bạn không có quyền thực hiện hành động này!",
        success: false,
      });
    }
    next();
  };
};

const getIp = async () => {
  const ipResponse = await fetch("https://api.ipify.org/?format=json");
  const ipData = await ipResponse.json();
  const userIP = ipData.ip;
  console.log(userIP);

  const response = await axios.get(`http://ip-api.com/json/${userIP}`);

  const { country, regionName, city } = response.data;
  location = `${city}, ${regionName}, ${country}`;

  return location;
};
module.exports = {
  signToken,
  authenticateToken,
  authorizeRole,
  blacklist,
  getIp,
};
