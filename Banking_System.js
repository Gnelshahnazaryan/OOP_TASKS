class InsufficientFundsError extends Error {
  constructor(m) {
    super(m);
    this.name = "InsufficientFundsError";
  }
}

class InvalidTransactionError extends Error {
  constructor(m) {
    super(m);
    this.name = "InvalidTransactionError";
  }
}

class AuthorizationError extends Error {
  constructor(m) {
    super(m);
    this.name = "AuthorizationError";
  }
}

class ValidationError extends Error {
  constructor(m) {
    super(m);
    this.name = "ValidationError";
  }
}

const validationHelpers = {
  valideAccountNumber(value) {
    return typeof value === "string" && value.length >= 10;
  },

  validateType(type) {
    return typeof type == "string" && (type == "individual" || type == "joint");
  },

  non_negative(value) {
    return typeof value === "number" && value >= 0;
  },

  validName(value) {
    return value.length;
  },

  validEmail(value) {
    const regEx = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

    return regEx.test(value);
  },

  validTransactionType(value) {
    return (
      typeof value == "string" &&
      (value == "deposit" || value == "withdraw" || value == "transfer")
    );
  },

  validAmount(value) {
    return typeof value === "number" && !Number.isNaN(value);
  },
};

class BankAccount {
  #balance;
  #transactions = [];

  constructor(accountNumber, type, balance = 0) {
    if (new.target == BankAccount) {
      throw new TypeError("Abstract class can not instatiate");
    }

    if (!validationHelpers.valideAccountNumber(accountNumber)) {
      throw new ValidationError("validation error");
    }

    if (!validationHelpers.validateType(type)) {
      throw new ValidationError("type must be individual or joint");
    }

    this.accountNumber = accountNumber;
    this.type = type;
    this.balance = balance;
  }

  deposit(amount) {
    if (!validationHelpers.validAmount(amount)) {
      throw new ValidationError("Amount must be number");
    }

    const date = Date.now().toString();
    this.balance += amount;
    this.addTransaction(
      new Transaction(this.accountNumber, amount, "deposit", date)
    );
  }

  withdraw(amount) {
    if (!validationHelpers.validAmount(amount)) {
      throw new ValidationError("Amount must be number");
    }

    const date = Date.now().toString();
    if (this.#balance < amount) {
      throw new InsufficientFundsError("Insufficient Funds");
    }
    this.balance -= amount;
    this.addTransaction(
      new Transaction(this.accountNumber, amount, "withdraw", date)
    );
  }

  getAllTransactions() {
    return [...this.#transactions];
  }

  getTransactionSummary(limit = 10) {
    // let i;
    // let res = [];
    // let index = 0;

    // if(this.#transactions.length < 10){
    // 	 i = 0;
    // }else{
    // 	i = this.#transactions.length - limit;
    // }

    // for(; i  < this.#transactions.length; ++i){
    // 	res[index] = this.#transactions[i];
    // 	++index;
    // }

    // return res;

    if (this.#transactions.length < limit) {
      this.getAllTransactions();
    }

    return this.#transactions.slice(-limit);
  }

  addTransaction(transaction) {
    if (!(transaction instanceof Transaction)) {
      throw new ValidationError("Invalid trnasaction");
    }

    this.#transactions.push(transaction);
  }

  set balance(value) {
    if (!validationHelpers.non_negative(value)) {
      throw new ValidationError("balance must be positive");
    }

    this.#balance = value;
  }

  get balance() {
    return this.#balance;
  }
}

class JointAccount extends BankAccount {
  #owners = [];

  constructor(accountNumber, type, balance, ...owners) {
    super(accountNumber, type, balance);

    this.#owners = owners;
  }

  set owners(value) {
    if (value.length == 0) {
      throw new AuthorizationError("Error");
    }

    this.#owners = [...value];
  }

  get owners() {
    return this.#owners;
  }

  transferFunds(targetAccount, amount, actor) {
    if (!(targetAccount instanceof BankAccount)) {
      throw new ValidationError("Target account is not instance of Bank");
    }

    if (!validationHelpers.validAmount(amount)) {
      throw new ValidationError("Amount must be number");
    }

    if (this.balance < amount) {
      throw new InsufficientFundsError("InsufficientFundsError");
    }

    for (const person of this.owners) {
      if (actor == person) {
        const date = Date.now().toString();
        this.balance -= amount;
        targetAccount.deposit(amount);
        this.addTransaction(
          new Transaction(
            this.accountNumber,
            amount,
            "transfer",
            date,
            this.accountNumber,
            targetAccount.accountNumber
          )
        );
        return;
      }
    }

    throw new AuthorizationError("Invalid actor");
  }
}

class IndividualAccount extends BankAccount {
  constructor(accountNumber, type, balance) {
    super(accountNumber, type, balance);
  }

  transferFunds(targetAccount, amount, actor) {
    if (!(targetAccount instanceof BankAccount)) {
      throw new ValidationError("Target account is not instance of Bank");
    }

    if (!validationHelpers.validAmount(amount)) {
      throw new ValidationError("Amount must be number");
    }

    if (this.balance < amount) {
      throw new InsufficientFundsError("InsufficientFundsError");
    }

    const date = Date.now().toString();
    this.balance -= amount;
    targetAccount.deposit(amount);
    this.addTransaction(
      new Transaction(
        this.accountNumber,
        amount,
        "transfer",
        date,
        this.accountNumber,
        targetAccount.accountNumber
      )
    );
  }
}

class Customer {
  constructor(name, contactInfo) {
    let _name;
    let _contactInfo;

    Object.defineProperty(this, "name", {
      set(value) {
        if (!validationHelpers.validName(value)) {
          throw new TypeError("name can't be empty");
        }

        _name = value;
      },

      get() {
        return _name;
      },
    });

    Object.defineProperty(this, "contactInfo", {
      set(value) {
        if (!validationHelpers.validEmail(value)) {
          throw new ValidationError(
            "contact info must be mail or phone number"
          );
        }

        _contactInfo = value;
      },

      get() {
        return _contactInfo;
      },
    });

    this.name = name;
    this.contactInfo = contactInfo;
    this.accounts = [];
  }

  addAccount(account) {
    this.accounts.push(account);
  }

  viewAccounts() {
    return this.accounts;
  }

  viewTransactionHistory(accountNumber) {
    if (!this.accounts.includes(accountNumber)) {
      throw new AuthorizationError("Account not found");
    }
    return this.accounts[accountNumber].getAllTransactions();
  }
}

class Transaction {
  constructor(
    accountNumber,
    amount,
    transactionType,
    timestamp,
    fromAccount,
    toAccount
  ) {
    let _type;
    let _amount;
    let _account;

    Object.defineProperty(this, "transactionType", {
      set(value) {
        if (!validationHelpers.validTransactionType(value)) {
          throw new ValidationError(
            "Transaction Type must be deposit,withdraw or transfer"
          );
        }
        _type = value;
      },

      get() {
        return _type;
      },
    });

    Object.defineProperty(this, "amount", {
      set(value) {
        if (!validationHelpers.non_negative(value)) {
          throw new ValidationError("Transaction amount must be positive");
        }
        _amount = value;
      },

      get() {
        return _amount;
      },
    });

    Object.defineProperty(this, "accountNumber", {
      set(value) {
        if (!validationHelpers.valideAccountNumber(value)) {
          throw new ValidationError("validation error");
        }

        _account = value;
      },

      get() {
        return _account;
      },
    });

    if (fromAccount) {
      this.fromAccount = fromAccount;
    }

    if (toAccount) {
      this.toAccount = toAccount;
    }

    this.timestamp = timestamp;
    this.amount = amount;
    this.accountNumber = accountNumber;
    this.transactionType = transactionType;
  }
}
