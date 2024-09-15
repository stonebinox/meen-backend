import Car from "../models/Car";

const getCarById = async (carId: string) => {
  const car = Car.findOne({
    _id: carId,
  });

  if (!car) return null;

  return car;
};

export { getCarById };
