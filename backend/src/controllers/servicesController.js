const { Service } = require('../models/dbModel');

const getActiveServices = async (req, res) => {
  try {
    const services = await Service.getAllActive();
    res.json(services);
  } catch (error) {
    console.error('Error fetching active services:', error);
    res.status(500).json({ message: 'Server error retrieving services' });
  }
};

module.exports = {
  getActiveServices
};
