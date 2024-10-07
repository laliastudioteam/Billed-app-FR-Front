/**
 * @jest-environment jsdom
 */

//  import Jquery for testing modal
import $ from "jquery";
// import jest testing libray
import {screen, waitFor, fireEvent} from "@testing-library/dom";
// import files from project
import BillsUI from "../views/BillsUI.js";
import {bills} from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
// import routes / Router
import {ROUTES_PATH} from "../constants/routes.js";
import router from "../app/Router.js";
// import Mock data
import {localStorageMock} from "../__mocks__/localStorage.js";
import store from "../__mocks__/store";

// Condition of being connected as an employee description
describe("If connected as an employee", () => {
	// Condition of clicking on new button
	describe("When I click on the new bill button", () => {
		// New bill navigate to test
		test("handleClickNewBill function should navigate to the NewBill page", () => {
			document.body.innerHTML = `
                <button data-testid="btn-new-bill">New Bill</button>
                <div id="modaleFile" class="modal">
                    <div class="modal-body"></div>
                </div>
            `;

			let currentRoute = "";

			const onNavigate = route => {
				currentRoute = route;
			};

			// Class instanciation
			const billsContainer = new Bills({
				document,
				onNavigate,
				store: null,
				localStorage: window.localStorage,
			});

			// Button click test with @testing-library/dom
			const buttonNewBill = screen.getByTestId("btn-new-bill");

			// Button click test with @testing-library/dom
			fireEvent.click(buttonNewBill);

			// Test if route is newBill
			expect(currentRoute).toBe(ROUTES_PATH["NewBill"]);
		});
	});
	//Condition on beeing on the Bills page
	describe("When I am on Bills Page", () => {
		// Highlithed bill icon test
		test("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", {value: localStorageMock});
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			);
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");
			expect(windowIcon.classList.contains("active-icon")).toBe(true);
		});
		// Antichronological data ordreing test
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({data: bills});
			const dates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
				)
				.map(a => a.innerHTML);
			// antichronological function
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
		// Image display test
		test("handleClickIconEye should display the bill image when icon-eye is clicked", () => {
			// Bill picture Url
			const falseBillUrl =
				"https://wp.inews.co.uk/wp-content/uploads/2018/06/bill.jpg";
			document.body.innerHTML =
				`
                <div data-testid="icon-eye" class="icon-eye" data-bill-url="` +
				falseBillUrl +
				`"></div>
                <div id="modaleFile" class="modal">
                  <div class="modal-body"></div>
                </div>
            `;
			// Jquery function emulation
			$.fn.modal = function (action) {
				if (action === "show") {
					this[0].classList.add("show");
				}
			};
			//class instanciation
			const billsContainer = new Bills({
				document,
				onNavigate: () => {},
				store: null,
				localStorage: window.localStorage,
			});

			const iconEye = screen.getByTestId("icon-eye");

			// button click
			fireEvent.click(iconEye);

			// modal test
			// modal structure
			const modalBody = document.querySelector(".modal-body");
			expect(modalBody.innerHTML).toContain(falseBillUrl);

			// modal file
			const modaleFile = document.getElementById("modaleFile");
			expect(modaleFile.classList.contains("show")).toBe(true);
		});
	});
	// condition of retrieving data form mock
	describe("When I fetch bills from mock API", () => {
		// Bills fetech and display test
		test("Then bills should be fetched from API and displayed", async () => {
			// Page Ui model
			document.body.innerHTML = BillsUI({data: bills});

			// class instanciation
			const billsContainer = new Bills({
				document,
				onNavigate: () => {},
				store,
				localStorage: window.localStorage,
			});

			const fetchedBills = await billsContainer.getBills();
			// display test
			expect(fetchedBills.length).toBe(4);
			expect(fetchedBills[0].date).toBe("4 Avr. 04");
			expect(fetchedBills[1].date).toBe("3 Mar. 03");
		});
		// 404 error test
		test("Then it should show a 404 error message if an error occurs", async () => {
			store.bills = jest.fn(() => ({
				list: jest.fn(() => Promise.reject(new Error("Erreur 404"))),
			}));

			document.body.innerHTML = BillsUI({error: "Erreur 404"});

			// class instanciation
			const billsContainer = new Bills({
				document,
				onNavigate: () => {},
				store,
				localStorage: window.localStorage,
			});

			try {
				//GetBills call
				await billsContainer.getBills();
			} catch (error) {
				const errorMessage = screen.getByText(/Erreur 404/);
				expect(errorMessage).toBeTruthy();
			}
		});
		// 404 error test
		test("Then it should show a 500 error message if an error occurs", async () => {
			store.bills = jest.fn(() => ({
				list: jest.fn(() => Promise.reject(new Error("Erreur 500"))),
			}));

			// Page Ui model
			document.body.innerHTML = BillsUI({error: "Erreur 500"});

			// class instanciation
			const billsContainer = new Bills({
				document,
				onNavigate: () => {},
				store,
				localStorage: window.localStorage,
			});

			try {
				//GetBills call
				await billsContainer.getBills();
			} catch (error) {
				const errorMessage = screen.getByText(/Erreur 500/);
				expect(errorMessage).toBeTruthy();
			}
		});
	});
});
