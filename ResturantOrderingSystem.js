class DishNotFoundError extends Error {
  constructor(m) {
    super(m);
    this.name = "DishNotFoundError";
  }
}

class InvalidOrderError extends Error {
  constructor(m) {
    super(m);
    this.name = "InvalidOrderError";
  }
}

class ValidationError extends Error {
  constructor(m) {
    super(m);
    this.name = "ValidationError";
  }
}

const validationHelpers = {
  validateName(value) {
    return typeof value === "string" && value.length > 0;
  },

  validateDishName(value) {
    return typeof value === "string" && value.length > 0;
  },

  validatePrice(value) {
    return typeof value === "number" && value > 0;
  },

  validateContactInfo(value) {
    if (typeof value !== "string") return false;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\+?[1-9][0-9]{7,14}$/;

    if (!emailRegex.test(value)) {
      if (!phoneRegex.test(value)) {
        return false;
      }
    }
    return true;
  },

  validateCustomer(value) {
    return value instanceof Customer;
  },

  validateOrder(value) {
    return value instanceof Order;
  },
};

class Menu {
  #dishes = {};

  constructor() {
    if (new.target === Menu) {
      throw new TypeError("Abstract class can not have instances");
    }
  }

  addDish(dish) {
    if (!(dish instanceof Dish)) {
      throw new ValidationError("dish must be instance of Dish");
    }

    if (this.#dishes[dish.name]) {
      throw new ValidationError("Dish already exists");
    }

    this.#dishes[dish.name] = dish;
  }

  removeDish(dishName) {
    if (!(dishName in this.#dishes)) {
      throw new DishNotFoundError("Dish not found");
    }

    delete this.#dishes[dishName];
  }

  viewMenu() {
    return { ...this.#dishes };
  }

  increasePrice(dishName, percent) {
    const dish = this.#dishes[dishName];
    if (!dish) {
      throw new DishNotFoundError("Dish not found in menu");
    }
    if (typeof percent !== "number" || percent <= 0) {
      throw new ValidationError("Percent must be positive number");
    }
    dish.price = Math.round(dish.price * (1 + percent / 100));
  }

  decreasePrice(dishName, percent) {
    const dish = this.#dishes[dishName];
    if (!dish) {
      throw new DishNotFoundError("Dish not found in menu");
    }
    if (typeof percent !== "number" || percent <= 0) {
      throw new ValidationError("Percent must be positive number");
    }
    const newPrice = dish.price * (1 - percent / 100);
    if (newPrice <= 0) {
      throw new ValidationError("Price cannot be zero or negative number");
    }
    dish.price = Math.round(newPrice);
  }

  applyDemandPricing(popularDishNames) {
    if (!Array.isArray(popularDishNames)) {
      throw new ValidationError("Must be an array of dish names");
    }
    for (const name of popularDishNames) {
      if (this.#dishes[name]) {
        this.#dishes[name].price = Math.round(this.#dishes[name].price * 1.2);
      }
    }
  }
}

class AppetizersMenu extends Menu {
  constructor() {
    super();
    this.maxPrice = 2000;
    this.prepTime = "7 minutes average";
  }

  addDish(dish) {
    if (dish.price > this.maxPrice) {
      throw new ValidationError("Appetizer price exceeds max price");
    }
    super.addDish(dish);
  }
}

class EntreesMenu extends Menu {
  constructor() {
    super();
    this.maxPrice = 5000;
    this.prepTime = "15 minutes average";
  }

  addDish(dish) {
    if (dish.price > this.maxPrice) {
      throw new ValidationError("Appetizer price exceeds max price");
    }
    super.addDish(dish);
  }
}

class DessertsMenu extends Menu {
  constructor() {
    super();
    this.maxPrice = 4000;
    this.prepTime = "9 minutes average";
  }

  addDish(dish) {
    if (dish.price > this.maxPrice) {
      throw new ValidationError("Appetizer price exceeds max price");
    }
    super.addDish(dish);
  }
}

class Customer {
  constructor(name, contactInfo) {
    let _name;
    let _contactInfo;

    Object.defineProperty(this, "name", {
      set(value) {
        if (!validationHelpers.validateName(value)) {
          throw new ValidationError("Name must be non-empty string");
        }
        _name = value;
      },

      get() {
        return _name;
      },
    });

    Object.defineProperty(this, "contactInfo", {
      set(value) {
        if (!validationHelpers.validateContactInfo(value)) {
          throw new ValidationError("Contact info must be email");
        }

        _contactInfo = value;
      },

      get() {
        return _contactInfo;
      },
    });

    this.name = name;
    this.contactInfo = contactInfo;
    this.orderHistory = [];
  }

  placeOrder(order) {
    if (!validationHelpers.validateOrder(order)) {
      throw new InvalidOrderError("order must be instace of Order class");
    }

    this.orderHistory.push(order);
  }

  viewOrderHistory() {
    return [...this.orderHistory];
  }
}

class Order {
  #totalPrice = 0;

  constructor(customer) {
    if (!validationHelpers.validateCustomer(customer)) {
      throw new ValidationError("customer must be instance of Customer class");
    }

    this.customer = customer;
    this.dishes = [];
  }

  addDish(dishName, menus) {
    for (const menu of menus) {
      const menuItems = menu.viewMenu();
      if (menuItems[dishName]) {
        this.dishes.push(menuItems[dishName]);
        this.#totalPrice += menuItems[dishName].price;
        return;
      }
    }
    throw new DishNotFoundError("Dish not found in any menu");
  }

  getTotal() {
    return this.#totalPrice;
  }

  viewSummary() {
    return {
      customer: this.customer.name,
      dishes: this.dishes.map((d) => d.name),
      total: this.#totalPrice,
    };
  }
}

class Dish {
  constructor(name, price) {
    let _name;
    let _price;

    Object.defineProperty(this, "name", {
      set(value) {
        if (!validationHelpers.validateDishName(value)) {
          throw new ValidationError("Dish name must be non-empty string");
        }

        _name = value;
      },

      get() {
        return _name;
      },
    });

    Object.defineProperty(this, "price", {
      set(value) {
        if (!validationHelpers.validatePrice(value)) {
          throw new ValidationError("Price must be positive number");
        }

        _price = value;
      },

      get() {
        return _price;
      },
    });

    this.name = name;
    this.price = price;
  }
}
