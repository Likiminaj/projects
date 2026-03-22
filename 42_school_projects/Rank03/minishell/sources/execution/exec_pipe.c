/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   exec_pipe.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/04 16:01:54 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/20 14:44:44 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

void	exec_left(t_ast *ast, t_env *env, int *fd);
void	exec_right(t_ast *ast, t_env *env, int *fd);
int		fork_error_cleanup(int fd[2]);

/* Executes left side of pipe with stdout
redirected to pipe write end. */
void	exec_left(t_ast *ast, t_env *env, int *fd)
{
	close(fd[0]);
	if (dup2(fd[1], STDOUT_FILENO) == -1)
		exit (1);
	close(fd[1]);
	ft_restore_signals();
	exit(ft_exec_ast(ast->left, env));
}

/* Executes right side of pipe with stdin
redirected from pipe read end. */
void	exec_right(t_ast *ast, t_env *env, int *fd)
{
	close(fd[1]);
	if (dup2(fd[0], STDIN_FILENO) == -1)
		exit (1);
	close(fd[0]);
	ft_restore_signals();
	exit(ft_exec_ast(ast->right, env));
}

/* Cleans up pipe file descriptors and restores signals after fork error. */
int	fork_error_cleanup(int fd[2])
{
	ft_interactive_signals();
	perror("fork");
	close(fd[0]);
	close(fd[1]);
	return (1);
}
