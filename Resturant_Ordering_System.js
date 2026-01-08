class DishNotFoundError extends Error{
    constructor(m){
        super(m);
        this.name = "DishNotFoundError";
    }
}


class InvalidOrderError extends Error{
    constructor(m){
        super(m);
        this.name = "InvalidOrderError";
    }
}


class ValidationError extends Error{
    constructor(m){
        super(m);
        this.name = "ValidationError";
    }
}


const validationHelpers = {

    validName(value){

        return typeof value === 'string' && value.length > 0;

    },


    validDishName(value){
       return typeof value === "string" && value.length > 0;
    },


    validPrice(value){
        return typeof value == 'number' && value > 0;
    },

    validContactInfo(value){

        return typeof value == 'string' && value.length >= 9;

    },

    validCustomer(value){
        return value instanceof Customer;
    },

    validOrder(value){
        return value instanceof Order;
    }


};


class Menu{

    #dishes = {};

    constructor(){
        if(new.target == Menu){
            throw new TypeError("Abstrac class can not instatiate");
        }
    }

    addDish(dish){
        if(!(dish instanceof Dish)){
            throw new ValidationError("Invalid dish");
        }
        this.#dishes[dish.name] = dish;
    }

    removeDish(dishName){

         if(!(dishName in this.#dishes)){
            throw new DishNotFoundError("Dish not found");
        }

        delete this.#dishes[dishName];
    }

    viewMenu(){
        return {...this.#dishes};
    }


    increasePrice(dishName, percent) {
        const dish = this.#dishes[dishName];
        if (!dish) {
            throw new DishNotFoundError("Dish not found in menu");
        }
        if (typeof percent !== "number" || percent <= 0) {
            throw new ValidationError("Percent must be positive");
        }
        dish.price = Math.round(dish.price * (1 + percent / 100));
    }


    decreasePrice(dishName, percent) {
        const dish = this.#dishes[dishName];
        if (!dish) {
            throw new DishNotFoundError("Dish not found in menu");
        }
        if (typeof percent !== "number" || percent <= 0) {
            throw new ValidationError("Percent must be positive");
        }
        const newPrice = dish.price * (1 - percent / 100);
        if (newPrice <= 0) {
            throw new ValidationError("Price cannot be zero or negative");
        }
        dish.price = Math.round(newPrice);
    }


     applyDemandPricing(popularDishNames) {
        if (!Array.isArray(popularDishNames)) {
            throw new ValidationError("Must be an array of dish names");
        }
        for (const name of popularDishNames) {
            if (this.#dishes[name]) {
                this.#dishes[name].price = Math.round(
                    this.#dishes[name].price * 1.2
                );
            }
        }
    }

}


class AppetizersMenu extends Menu{
    constructor(){
        super();
        this.maxPrice = 2000;
        this.prep_time = "7 minutes average";
    }
}



class EntreesMenu extends Menu{

    constructor(){
        super();
        this.maxPrice = 5000;
        this.prep_time = "15 minutes average";
    }


}


class DessertsMenu extends Menu{
    constructor(){
        super();
        this.maxPrice = 4000;
        this.prep_time = "9 minutes average";
    }
}


class Customer {
    constructor(name,contactInfo){
        let _name;
        let _contactInfo;

        Object.defineProperty(this,"name",{

            set(value){
                if(!validationHelpers.validName(value)){
                    throw new ValidationError("Invalid Name");
                }
                _name = value;
            },

            get(){
                return _name;
            }

        });


        Object.defineProperty(this,"contactInfo",{

            set(value){

                if(!validationHelpers.validContactInfo(value)){
                    throw new ValidationError("Invalid contact information");
                }

                _contactInfo = value;

            },
            

            get(){
                return _contactInfo;
            }

        });

        this.name = name;
        this.contactInfo = contactInfo;
        this.orderHistory = [];

    }


    placeOrder(order){
        if(!(validationHelpers.validOrder(order))){
            throw new InvalidOrderError("order must be instace of Order class");
        }
        
        this.orderHistory.push(order);

    }


    viewOrderHistory(){
        return [...this.orderHistory];
    }

}


class Order{

    #totalPrice = 0;

    constructor(customer){
 
        if(!validationHelpers.validCustomer(customer)){
            throw new ValidationError("invalid customer");
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
        throw new DishNotFoundError("Dish not found in any menu")
    }


   getTotal(){
        return this.#totalPrice;
    }


    viewSummary(){
        return {
            dishes: [...this.dishes],
            total: this.#totalPrice
        };
    }

}


class Dish{
    constructor(name,price){
        let _name;
        let _price;

        Object.defineProperty(this,"name",{
            set(value){
                if(!validationHelpers.validDishName(value)){
                    throw new ValidationError("Invalid dish name");
                }

                _name = value;

            },

            get(){
                return _name;
            }

        });

        Object.defineProperty(this,"price",{

            set(value){

                if(!validationHelpers.validPrice(value)){
                    throw new ValidationError("Invalid price");
                }

                _price = value;

            },

            get(){

                return _price;

            }

        });


        this.name = name;
        this.price = price;

    }

}