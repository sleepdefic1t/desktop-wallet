/* eslint-disable @typescript-eslint/require-await */
import { fireEvent, render, RenderResult, waitFor } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react-hooks";
import React from "react";
import { FormContext, useForm } from "react-hook-form";

import { FirstStep, FourthStep, SecondStep, SendVoteTransaction, ThirdStep } from "./SendVoteTransaction";

describe("SendVoteTransaction", () => {
	it("should render 1st step", async () => {
		const { result: form } = renderHook(() => useForm());
		const { getByTestId, asFragment } = render(
			<FormContext {...form.current}>
				<FirstStep />
			</FormContext>,
		);

		expect(getByTestId("SendVoteTransaction__step--first")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 2st step", async () => {
		const { getByTestId, asFragment } = render(<SecondStep />);

		expect(getByTestId("SendVoteTransaction__step--second")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 3st step", async () => {
		const { result: form } = renderHook(() => useForm());
		const { getByTestId, asFragment } = render(
			<FormContext {...form.current}>
				<ThirdStep />
			</FormContext>,
		);

		expect(getByTestId("SendVoteTransaction__step--third")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 4st step", async () => {
		const { getByTestId, asFragment } = render(<FourthStep />);

		expect(getByTestId("SendVoteTransaction__step--fourth")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render", async () => {
		let rendered: RenderResult;

		await act(async () => {
			rendered = render(<SendVoteTransaction />);
			await waitFor(() => expect(rendered.getByTestId(`SendVoteTransaction__step--first`)).toBeTruthy());
		});

		const { getByTestId, asFragment } = rendered!;

		expect(asFragment()).toMatchSnapshot();

		await act(async () => {
			const continueButton = getByTestId(`SendVoteTransaction__button--continue`);

			// Navigation between steps
			await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

			fireEvent.click(continueButton);
			expect(getByTestId(`SendVoteTransaction__step--second`)).toBeTruthy();

			fireEvent.click(continueButton);
			expect(getByTestId(`SendVoteTransaction__step--third`)).toBeTruthy();

			// Back
			fireEvent.click(getByTestId(`SendVoteTransaction__button--back`));
			expect(getByTestId(`SendVoteTransaction__step--second`)).toBeTruthy();

			fireEvent.click(continueButton);
			fireEvent.click(continueButton);
			await waitFor(() => expect(getByTestId(`SendVoteTransaction__button--back-to-wallet`)).toBeTruthy());
		});
	});
});