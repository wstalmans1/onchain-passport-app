'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { ChakraProvider, Flex, Heading, Button } from '@chakra-ui/react'
import { TabLayout } from './tab-contents'
import { DecoderAbi } from './PassportDecoderABI';


//import { GITCOIN_PASSPORT_WEIGHTS } from './stamp-weights';
 
const decoderContractAddress = "0x5558D441779Eca04A329BcD6b47830D2C6607769";
//const abi = require('./PassportDecoderABI.ts')
 
declare global {
  interface Window {
    ethereum: any
  }
}
 
declare global {
  var provider: ethers.BrowserProvider
}
 
interface Stamp {
  id: number
  stamp: string
}
 
export default function Passport() {
  // here we deal with any local state we need to manage
  const [address, setAddress] = useState<string>('default')
  const [connected, setConnected] = useState<boolean>(false)
  const [hasStamps, setHasStamps] = useState<boolean>(false)
  const [stamps, setStamps] = useState<Array<Stamp>>([])
  const [score, setScore] = useState<number>(0)
  const [network, setNetwork] = useState<string>('')
 
  useEffect(() => {
    checkConnection()
    async function checkConnection() {
      if (connected) {
        console.log("already connected")
      } else {
        const result = await connect()
        console.log(result)
      }
    }
  }, [address, connected])
 
  async function connect() {
    try {
      globalThis.provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const network = await provider.getNetwork()
      setAddress(accounts[0])
      setConnected(true)
      setNetwork(network.chainId.toString())
    } catch (err) {
      console.log('error connecting...')
    }
    return true
  }

  /** get passport info from decoder contract */
  async function getPassportInfo() {
    console.log(address)
    const decoderContract: ethers.Contract = new ethers.Contract(decoderContractAddress, new ethers.Interface(DecoderAbi['0x1a4']), provider)
    try {
      const passportInfo: [] = await decoderContract.getPassport(address)
      return passportInfo
    } catch {
      throw new Error("no passport information available")
    }
  }

  /** parse out stamps from passport info object*/
  function getStamps(passportInfo: []) {
    var stamps: Stamp[] = [];
    for (var i = 0; i < passportInfo.length; i++) {
      stamps.push({ id: i, stamp: passportInfo[i][0] })
    }
    return stamps
  }

  /** get poassport score from decoder contract */
  async function getScore() {
    const decoderContract: ethers.Contract = new ethers.Contract(decoderContractAddress, new ethers.Interface(DecoderAbi['0x1a4']), provider)
    try {
      const score = await decoderContract.getScore(address)
      return score
    } catch {
      throw new Error("no passport info available")
    }
  }

  /** call getPassportInfo and getStamps and set state vars */
  async function queryPassport() {
    const passportData = await getPassportInfo();
    const stamps = getStamps(passportData);
    if (stamps.length > 1) {
      setHasStamps(true)
      setStamps(stamps)
    }
    const score = await getScore()
    setScore(parseInt(score) / 10000)
  }
 
  const styles = {
    main: {
      width: '900px',
      margin: '0 auto',
      paddingTop: 90
    }
  }
 
  return (
    /* this is the UI for the app */
    <div style={styles.main}>
      <ChakraProvider>
        <Flex minWidth='max-content' alignItems='right' gap='2' justifyContent='right'>
          <Button colorScheme='teal' variant='outline' onClick={connect}>Connect</Button>
          <Button colorScheme='teal' variant='outline' onClick={queryPassport}>Query Passport</Button>
        </Flex>
        <div>
          {connected && <p>✅ Wallet connected</p>}
          {connected && network == "10" && <p>✅ network: Optimism</p>}
          {connected && network != "10" && <p>🔴 Please switch to Optimism network</p>}
        </div>
        <br />
        <br />
        <br />
        <br />
        <Heading as='h1' size='4xl' noOfLines={2}>Onchain Stamp Explorer!</Heading>
        <br />
        <br />
        <TabLayout hasStamps={hasStamps} stamps={stamps} score={score} />
      </ChakraProvider >
    </div >
  )
}
