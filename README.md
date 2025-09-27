## **Restaurant Billing System - README**

### **Project Overview**

This **Restaurant Billing System** is a simple Python application built using the `Tkinter` library. It allows customers to select various food and hygiene items from a predefined menu and calculates the total bill with applied taxes. The system also captures customer details like name, phone number, and generates a bill with all relevant information.

### **Key Features**

* User-friendly graphical user interface (GUI) to manage customer order details.
* Option to select items from three different categories: Snacks, Main Course, and Hygiene products.
* Dynamic calculation of the total price, including taxes for each category.
* Automatic generation of a bill with itemized details.
* The ability to clear all fields and reset the application for a new customer.

### **Technologies Used**

* **Python 3.x**
* **Tkinter** (for GUI development)
* **Random module** (for generating unique bill numbers)

### **How to Run the Project**

1. **Requirements:**

   * Python 3.x installed on your system.
   * Tkinter library (Tkinter is included with Python, but ensure it's available in your installation).

2. **Steps to Run:**

   1. Clone or download this repository to your local machine.
   2. Navigate to the project directory using the command line or terminal.
   3. Run the script using the following command:

      ```bash
      python main.py
      ```
   4. The application window will appear on your screen, where you can:

      * Enter customer details like name and phone number.
      * Select various food and hygiene items from the menu.
      * Click the **Total Bill** button to calculate the total bill with tax.
      * Use the **Clear Field** button to reset the fields for the next customer.
      * Press **Exit** to close the application.

**Note:**

   * Make sure to fill out customer details (name and phone number) before calculating the bill. The system will prompt you if the details are missing.
   * The bill will show a summary of items, quantities, prices, and taxes.

### **Example Output of the Bill**

```
   WELCOME TO SUPER MARKET
   Phone-No. 739275410
   Bill no. : 1234
   Customer Name : John Doe
   Phone No. : 9876543210
   ====================================
   Product             Qty     Price
   ====================================
   Samosa               2      240
   Paneer Tikka         1      40
   Butter Chicken       1      42
   ------------------------------------
   Snacks Tax           : 12.0 Rs
   Grocery Tax          : 0.5 Rs
   Beauty & Hyg. Tax    : 13.0 Rs
   Total Bill Amount    : 339.5 Rs
   ------------------------------------
```

### **Possible Enhancements (Future Scope)**

1. **Invoice Saving:**

   * Allow the user to save the generated bill as a PDF or text file for record-keeping.

2. **Database Integration:**

   * Store customer details and transaction history in a database for future reference.

3. **GUI Design Improvements:**

   * Enhance the design by adding images for the items and improving the layout for better user experience.

4. **Discounts and Offers:**

   * Add functionality to apply discount offers or loyalty points for frequent customers.

---

### Learnings from the project

1. **Tkinter Basics:**

   * How to create a GUI application using the `Tkinter` library.
   * Understanding various Tkinter widgets like `Label`, `Entry`, `Button`, `Frame`, and `Scrollbar`.
   * Managing the placement and layout of widgets using grid, pack, and place geometry managers.

2. **Working with Variables and Data Types:**

   * Handling `StringVar()` and `IntVar()` to track user inputs and dynamic updates of fields.
   * Using `StringVar()` to dynamically update the fields and labels in real-time.

3. **Handling Events and User Input:**

   * Implementing event handling for button clicks, such as calculating the bill, clearing fields, and exiting the application.
   * Managing error handling, such as ensuring that the user fills in all required fields before generating the bill.

4. **Building a Billing System:**

   * Organizing the project into categories such as Snacks, Main Course, and Hygiene.
   * Handling item selection and multiplying the quantity by the item price to calculate the total for each category.
   * Integrating tax calculations for each category and generating a final bill with taxes.

5. **Dynamic Text Updates:**

   * Using the `Text` widget to display the generated bill in a formatted manner with proper spacing and alignment.

6. **Random Bill Number Generation:**

   * Using Python’s `random.randint()` to generate unique bill numbers for each transaction.
