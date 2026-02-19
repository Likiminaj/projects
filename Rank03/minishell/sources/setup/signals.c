/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   signals.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/12 15:23:45 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/11 16:47:17 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#define _XOPEN_SOURCE 700

#include "../minishell.h"
#include "../../libft/libft.h"

// prototype(s)
void	ft_sigint_handler(int sig);
void	ft_restore_signals(void);
void	ft_heredoc_signals(void);
void	ft_heredoc_sigint_handler(int sig);

void	ft_interactive_signals(void)
{
	struct sigaction	sa;

	sa.sa_handler = ft_sigint_handler;
	sigemptyset(&sa.sa_mask);
	sa.sa_flags = SA_RESTART;
	sigaction(SIGINT, &sa, NULL);
	signal(SIGQUIT, SIG_IGN);
}

void	ft_sigint_handler(int sig)
{
	(void)sig;
	write(1, "\n", 1);
	rl_on_new_line();
	rl_replace_line("", 0);
	rl_redisplay();
}

void	ft_restore_signals(void)
{
	signal(SIGINT, SIG_DFL);
	signal(SIGQUIT, SIG_DFL);
}

void	ft_heredoc_signals(void)
{
	signal(SIGINT, ft_heredoc_sigint_handler);
	signal(SIGQUIT, SIG_IGN);
}

void	ft_heredoc_sigint_handler(int sig)
{
	(void)sig;
	write(1, "\n", 1);
	exit(130);
}
