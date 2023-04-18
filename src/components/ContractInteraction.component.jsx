import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './style.css';

const ReactAlert = withReactContent(Swal);

const web3 = new Web3(Web3.givenProvider);

function ContractInteraction({ contractAddress, abi }) {
	const [contractInstance, setContractInstance] = useState(null);
	const [inputValues, setInputValues] = useState({});
	const [activeFunction, setActiveFunction] = useState(null);
	const [operationPending, setOperationPending] = useState(false);

	const onInputChange = (event) => {
		setInputValues({
			...inputValues,
			[event.target.name]: event.target.value,
		});
	};

	useEffect(() => {
		const contract = new web3.eth.Contract(abi, contractAddress);
		setContractInstance(contract);
	}, [contractAddress, abi]);

	const onFunctionClick = async (item, isPayable, isStateChanging) => {
		if (!contractInstance) {
			const contract = new web3.eth.Contract(abi, contractAddress);
			setContractInstance(contract);
		}

		const method = contractInstance.methods[item.name];
		let inputNames = [];
		if (item.name !== 'addressMintedBalance' && item.name !== 'subOwners' && item.name !== 'whitelistedAddresses') {
			inputNames = abi.find(abiFunction => abiFunction.name === item.name).inputs.map(input => input.name);
		} else {
			inputNames = [item.name];
			console.log(inputNames);
		}

		const inputValuesArray = inputNames.map((name) => inputValues[name] || 0);
		const fromAddress = (await web3.eth.getAccounts())[0];

		const options = { from: fromAddress };
		if (isPayable) {
			try {
				setOperationPending(true);
				const gasAmount = await method(...inputValuesArray).estimateGas({
					from: fromAddress
				});
				options.gasLimit = gasAmount;
				const value = inputValuesArray.shift();
				options.value = web3.utils.toWei(value.toString());
				const result = await method(...inputValuesArray).send(options);
				console.log('Transaction result:', result);
				ReactAlert.fire({
					title: 'Function call successful'
				});
			} catch (err) {
				setOperationPending(false);
				console.log(err);
				ReactAlert.fire({
					title: 'Function call failed',
					text: err.message
				});
			}
		} else if (isStateChanging) {
			try {
				setOperationPending(true);
				const gasAmount = await method(...inputValuesArray).estimateGas({
					from: fromAddress
				});
				options.gasLimit = gasAmount;
				const result = await method(...inputValuesArray).send(options);
				console.log('Transaction result:', result);
				ReactAlert.fire({
					title: 'Function call successful'
				});
			} catch (err) {
				setOperationPending(false);
				console.log(err);
				ReactAlert.fire({
					title: 'Function call failed',
					text: err.message
				});
			}
		} else {
			try {
				setOperationPending(true);
				console.log(inputValuesArray);
				const result = await method(...inputValuesArray).call(options);
				ReactAlert.fire({
					title: 'Function call success',
					text: `Result: ${result}`
				});
			} catch (err) {
				setOperationPending(false);
				console.log(err);
				ReactAlert.fire({
					title: 'Function call failed',
					text: err.message
				});
			}
		}

		setOperationPending(false);
		setInputValues({});
	};

	const isPayable = (item) => {
		return item.stateMutability === 'payable';
	}

	const isStateChanging = item => item.stateMutability === 'nonpayable'

	const parseInputs = (item) => {
		const fnInputs = item.inputs;

		let earlyInputReturn = null;

		if (fnInputs[0]?.name === '') {
			switch (item.name) {
				case 'addressMintedBalance':
					earlyInputReturn = (
						<input
							className='functionInput'
							key={'addressMintedBalance'}
							type="text"
							name={'addressMintedBalance'}
							placeholder={'address'}
							value={inputValues['addressMintedBalance'] ? inputValues['addressMintedBalance'] : ''}
							onChange={onInputChange}
						/>
					);
					break;
				case 'subOwners':
					earlyInputReturn = (
						<input
							className='functionInput'
							key={'subOwners'}
							type="text"
							name={'subOwners'}
							placeholder={'idx'}
							value={inputValues['subOwners'] ? inputValues['subOwners'] : ''}
							onChange={onInputChange}
						/>
					);
					break;
				case 'whitelistedAddresses':
					earlyInputReturn = (
						<input
							className='functionInput'
							key={'whitelistedAddresses'}
							type="text"
							name={'whitelistedAddresses'}
							placeholder={'idx'}
							value={inputValues['whitelistedAddresses'] ? inputValues['whitelistedAddresses'] : ''}
							onChange={onInputChange}
						/>
					)
					break;
				default:
					break;
			}
		}

		if (earlyInputReturn) {
			return earlyInputReturn;
		}

		const inputs = fnInputs.map((input, i) => (
			<input
				className='functionInput'
				key={input.name}
				type="text"
				name={input.name}
				placeholder={input.name}
				value={inputValues[input.name] && activeFunction === item.name ? inputValues[input.name] : ''}
				onChange={onInputChange}
			/>
		));

		return inputs;
	}

	const parseFunctions = () => {
		const abiFunctions = abi
			.filter((item) => item.type === 'function');

		return <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
			{
				abiFunctions.map((item, idx) => (
					<div key={idx} className='functionBtnWrapper' onClick={() => setActiveFunction(item.name)}>
						<button
							className='funtionBtn'
							style={{
								backgroundColor: isPayable(item)
									? '#B84040'
									: isStateChanging(item)
										? 'rgb(201,117,57)'
										: '#355F7D',
							}}
							onClick={() => onFunctionClick(item, isPayable(item), isStateChanging(item))}
						>
							{item.name}
							{
								(operationPending && activeFunction === item.name) ?
									<div className='loader'></div> :
									null
							}
						</button>
						<div className='functionInputs'>
							{
								parseInputs(item)
							}
						</div>
					</div>
				))
			}
		</div>
	}

	return (
		<div>
			<h1>Confict22 contract interaction</h1>
			<div>{contractInstance && parseFunctions()}</div>
		</div>
	);
}

export default ContractInteraction;
