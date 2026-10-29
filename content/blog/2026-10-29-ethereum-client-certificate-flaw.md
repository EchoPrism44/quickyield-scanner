---
title: "Ethereum Clients Patch Certificate Flaw That Could Put Some Validator Rewards at Risk"
date: "2026-10-29"
excerpt: "Teku and Besu have updated their Docker images to distrust certificates tied to compromised eMudhra authorities. The issue affected specific configurations, not default Teku mainnet nodes."
description: "Ethereum clients Teku and Besu patched certificate-trust issues linked to compromised eMudhra certificate authorities. Here is what node operators need to know."
author: "Litmus News Desk"
category: "Security"
tags:
  - Ethereum
  - Security
  - Infrastructure
type: "news"
featured: true
readMinutes: 4
---

Ethereum client teams have released updates to address a certificate-trust problem linked to compromised eMudhra certificate authorities. The flaw could have allowed an attacker positioned between certain validator services to impersonate a trusted service and redirect block rewards.

The issue is configuration-dependent. Teku's developers said a default Teku node on Ethereum mainnet was not affected and that no exploitation had been reported.

## What changed

Teku released version **26.10.3**, while Besu released version **26.10.2**. Their updated Docker images remove trust in certificate authorities associated with the eMudhra incident.

The projects' release notes describe the changes directly: [Teku 26.10.3 release notes](https://github.com/Consensys-Incorporated/teku/releases) and [Besu 26.10.2 release notes](https://github.com/besu-eth/besu/releases).

The wider incident involved weakly generated private keys for eight intermediate certificate authorities. Researchers were able to recover the keys, creating a risk that forged certificates could be accepted by software that still trusted the affected certificate chain. The issue was not caused by a consensus-rule change in Ethereum itself.

## How validator rewards could be exposed

Ethereum validators communicate with other services, and those connections rely on certificates to establish the identity of the service on the other end. If vulnerable software accepts a forged certificate, an attacker who can intercept the connection may be able to impersonate that service.

In certain setups, that could affect a validator's interaction with an external signer or another service involved in block production. A malicious service could potentially influence where execution-layer rewards are sent.

This is not the same as an attacker automatically taking control of a validator's withdrawal credentials or stealing all staked ETH. The reported risk depends on the software, trust store, and validator configuration involved.

CoinDesk's [report on the client updates](https://www.coindesk.com/tech/2026/10/29/ethereum-clients-patch-flaw-that-could-let-attackers-redirect-eth-rewards) describes the potential reward-redirection scenarios and the distinction between affected configurations and default mainnet setups.

## What node operators should do

Operators should review the client and runtime they actually run, rather than assuming that updating one component updates every certificate store.

- **Teku Docker users:** move to the latest patched image, currently listed as 26.10.3 in the project's release notes.
- **Besu Docker users:** move to the latest patched image, currently listed as 26.10.2 in the project's release notes.
- **Native installations:** check the client team's instructions and the Java runtime's trusted certificate store. Updating the client package alone may not update a separately installed Java runtime.
- **External signer setups:** review the exact configuration and follow the client team's security guidance.

Check the release pages for later patches before making a change. Software versions can move quickly during a security response.

## Why this matters beyond Ethereum

The incident is a reminder that blockchain security extends beyond smart contracts and consensus clients. Certificate authorities, operating systems, language runtimes, container images, and external signing services are all part of the infrastructure that validators rely on.

A protocol can have sound consensus rules and still inherit risk from a dependency elsewhere in the stack. For node operators, maintaining a current inventory of software versions and trust stores is part of operational security.

## Sources

- [Teku releases](https://github.com/Consensys-Incorporated/teku/releases)
- [Besu releases](https://github.com/besu-eth/besu/releases)
- [CoinDesk: Ethereum clients patch flaw that could let attackers redirect ETH rewards](https://www.coindesk.com/tech/2026/10/29/ethereum-clients-patch-flaw-that-could-let-attackers-redirect-eth-rewards)

*This report reflects information available on October 29, 2026. It is informational and does not constitute investment advice.*
