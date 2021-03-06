import { ReadOnlyWallet, ReadWriteWallet } from "@arkecosystem/platform-sdk-profiles";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Circle } from "app/components/Circle";
import { Dropdown } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { TableCell, TableRow } from "app/components/Table";
import { useEnvironmentContext } from "app/contexts";
import { useDarkMode } from "app/hooks";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { DelegateRowItemSkeleton } from "./DelegateRowItemSkeleton";

type DelegateRowItem = {
	wallet: ReadWriteWallet;
	onAction?: any;
	isConfirmed: boolean;
};

const getStatusIcon = (confirmed: boolean) => {
	if (!confirmed) {
		return <Icon name="StatusClock" className="text-theme-neutral" />;
	}

	return <Icon name="Checkmark" className="text-theme-success" width={30} height={30} />;
};

export const DelegateRowItem = ({ wallet, onAction, isConfirmed }: DelegateRowItem) => {
	const { env } = useEnvironmentContext();

	const [delegateInfo, setDelegateInfo] = useState<ReadOnlyWallet>();
	const [shadowColor, setShadowColor] = React.useState<string>("--theme-background-color");

	const isDark = useDarkMode();

	const { t } = useTranslation();

	const options = [
		{ label: t("COMMON.UPDATE"), value: "updateDelegate" },
		{ label: t("COMMON.RESIGN"), value: "resignDelegate" },
	];

	useEffect(() => {
		setDelegateInfo(env.delegates().findByAddress(wallet.coinId(), wallet.networkId(), wallet.address()));
	}, [env, wallet]);

	if (!delegateInfo) {
		return <DelegateRowItemSkeleton />;
	}

	return (
		<TableRow
			onMouseEnter={() => setShadowColor(isDark ? "--theme-color-neutral-800" : "--theme-color-neutral-100")}
			onMouseLeave={() => setShadowColor("")}
		>
			<TableCell variant="start" innerClassName="space-x-4">
				<span data-testid="DelegateRowItem__address" className="flex items-center -space-x-1">
					<Circle className="border-theme-neutral-800" size="lg" shadowColor={shadowColor}>
						<Icon name="Delegate" width={22} height={22} />
					</Circle>
					<Avatar address={wallet.address()} size="lg" shadowColor={shadowColor} />
				</span>
				<span data-testid="DelegateRowItem__username">{delegateInfo.username()}</span>
			</TableCell>

			<TableCell innerClassName="font-semibold text-theme-secondary-text justify-end">
				<span data-testid="DelegateRowItem__rank">#{delegateInfo.rank()}</span>
			</TableCell>

			<TableCell innerClassName="font-semibold justify-center text-theme-primary">
				<span data-testid="DelegateRowItem__msq">
					<Icon name="Msq" width={22} height={22} />
				</span>
			</TableCell>

			<TableCell innerClassName="text-theme-neutral-light justify-center">
				<span data-testid="DelegateRowItem__status">{getStatusIcon(isConfirmed)}</span>
			</TableCell>

			<TableCell innerClassName="font-semibold text-theme-secondary-text justify-end">
				<span data-testid="DelegateRowItem__forged" className="whitespace-no-wrap">
					2,450.643 Ѧ
				</span>
			</TableCell>

			<TableCell innerClassName="font-semibold text-theme-secondary-text justify-end">
				<span data-testid="DelegateRowItem__votes">
					<small className="text-theme-neutral">2,43%</small>
					<span className="ml-1 whitespace-no-wrap">2,450.643 Ѧ</span>
				</span>
			</TableCell>

			<TableCell variant="end" className="w-22" innerClassName="justify-end">
				<span data-testid="DelegateRowItem__actions">
					<Dropdown
						toggleContent={
							<Button variant="plain" size="icon">
								<Icon name="Settings" width={20} height={20} />
							</Button>
						}
						options={options}
						onSelect={({ value }: any) => onAction?.({ walletId: wallet.id(), action: value })}
					/>
				</span>
			</TableCell>
		</TableRow>
	);
};

DelegateRowItem.defaultProps = {
	isConfirmed: false,
};
