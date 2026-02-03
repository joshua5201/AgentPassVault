package com.agentvault;

import com.agentvault.config.VaultUiProperties;

import org.springframework.boot.SpringApplication;

import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.context.properties.EnableConfigurationProperties;



@SpringBootApplication

@EnableConfigurationProperties(VaultUiProperties.class)

public class AgentVaultApplication {



        public static void main(String[] args) {

                SpringApplication.run(AgentVaultApplication.class, args);

        }



}
