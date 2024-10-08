/**
 * @jest-environment jsdom
 */

// import jest testing libray
import {fireEvent, screen} from "@testing-library/dom";
// import files from project
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
// import Mock data
import {localStorageMock} from "../__mocks__/localStorage.js";
import store from "../__mocks__/store";
// import routes / Router
import {ROUTES_PATH} from "../constants/routes.js";

// Condition of being connected as an employee description
describe("Given I am connected as an employee", () => {
	// Preload values and storage before each test
	beforeEach(() => {
		Object.defineProperty(window, "localStorage", {value: localStorageMock});
		window.localStorage.setItem(
			"user",
			JSON.stringify({
				type: "Employee",
				email: "employee@test.com",
			})
		);
	});
	// Condition of being on the bill creation page
	describe("When I am on NewBill Page", () => {
		// Form display unit test
		test("Then the new bill form should be displayed", () => {
			const html = NewBillUI();
			document.body.innerHTML = html;

			const formNewBill = screen.getByTestId("form-new-bill");
			expect(formNewBill).toBeTruthy();
		});
	});
	// Condition of uploading a file with good parameters / format
	describe("When I upload a file with a valid format (jpg, jpeg, png)", () => {
		// File submission unit test
		test("Then the file should be accepted", () => {
			const html = NewBillUI();
			document.body.innerHTML = html;

			const onNavigate = pathname =>
				(document.body.innerHTML = ROUTES_PATH[pathname]);
			const newBill = new NewBill({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			});

			const fileInput = screen.getByTestId("file");
			const file = new File(["image"], "image.jpg", {type: "image/jpg"});
			const handleChangeFile = jest.fn(newBill.handleChangeFile);
			fileInput.addEventListener("change", handleChangeFile);

			fireEvent.change(fileInput, {target: {files: [file]}});
			expect(handleChangeFile).toHaveBeenCalled();
		});
	});
	// Condition of uploading a file with bad parameters / format
	describe("When I upload a file with an invalid format (pdf)", () => {
		// Alert display unit test
		test("Then an alert should be displayed", () => {
			const html = NewBillUI();
			document.body.innerHTML = html;

			const onNavigate = pathname =>
				(document.body.innerHTML = ROUTES_PATH[pathname]);
			const newBill = new NewBill({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			});

			const fileInput = screen.getByTestId("file");
			const file = new File(["document"], "document.pdf", {type: "application/pdf"});
			const handleChangeFile = jest.fn(newBill.handleChangeFile);
			fileInput.addEventListener("change", handleChangeFile);

			global.alert = jest.fn();

			fireEvent.change(fileInput, {target: {files: [file]}});

			expect(global.alert).toHaveBeenCalledWith("Mauvais format");
		});
	});
	// Condition of submitting the form with good parameters
	describe("When I submit the form with valid inputs", () => {
		// New bill integration test
		test("Then a new bill should be created", () => {
			const html = NewBillUI();
			document.body.innerHTML = html;

			const onNavigate = jest.fn();
			const newBill = new NewBill({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			});

			const form = screen.getByTestId("form-new-bill");
			const handleSubmit = jest.fn(newBill.handleSubmit);
			form.addEventListener("submit", handleSubmit);

			fireEvent.submit(form);

			expect(handleSubmit).toHaveBeenCalled();

			expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
		});
	});
	// Condition of submitting the form with good parameters
	describe("When I try to fetch a bill that does not exist (404)", () => {
		// Error log integration test
		test("Then an error should be logged", async () => {
			// Mock update Method for 500 error
			const errorMessage = "404 Not Found";
			store.bills = jest.fn().mockReturnValue({
				// Error ?
				get: jest.fn().mockRejectedValue(new Error(errorMessage)),
			});

			const onNavigate = jest.fn();
			const newBill = new NewBill({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			});

			// Jest Spy method : error loggued?
			const errorSpy = jest.spyOn(console, "error").mockImplementation();

			// Fetechbill call with an invalid value
			await expect(newBill.fetchBill("invalid-id")).rejects.toThrow(errorMessage);

			// Check for error to be loggued
			expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));

			errorSpy.mockRestore(); // Restaurez le comportement par défaut de console.error
		});
	});
	// Condition of submiting a bill with a 500 error
	describe("When I submit a bill and there is a 500 error", () => {
		// Error log integration test
		test("Then an error should be logged", async () => {
			const html = NewBillUI();
			document.body.innerHTML = html;

			const onNavigate = jest.fn();
			const logErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

			// Mock update Method for 500 error
			const newBill = new NewBill({
				document,
				onNavigate,
				store: {
					bills: jest.fn().mockReturnValue({
						update: jest.fn().mockRejectedValue(new Error("500 Internal Server Error")),
					}),
				},
				localStorage: window.localStorage,
			});

			const form = screen.getByTestId("form-new-bill");
			fireEvent.submit(form);

			// Await ! Promises
			await new Promise(process.nextTick);

			expect(logErrorSpy).toHaveBeenCalledWith(expect.any(Error));

			// Log Mock restore
			logErrorSpy.mockRestore();
		});
	});
});
