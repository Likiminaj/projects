/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   exec_pipe.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/04 16:01:54 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/26 16:14:22 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		exec_pipe(t_ast *ast, t_env *env);
void	exec_left(t_ast *ast, t_env *env, int *fd);
void	exec_right(t_ast *ast, t_env *env, int *fd);
int		fork_error_cleanup(int fd[2]);

int	exec_pipe(t_ast *ast, t_env *env)
{
	int		fd[2];
	int		status;
	pid_t	pid_left;
	pid_t	pid_right;

	if (pipe(fd) == -1)
		return (perror("pipe"), 1);
	signal(SIGINT, SIG_IGN);
	signal(SIGQUIT, SIG_IGN);
	pid_left = fork();
	if (pid_left == -1)
		return (fork_error_cleanup(fd));
	if (pid_left == 0)
		exec_left(ast, env, fd);
	pid_right = fork();
	if (pid_right == -1)
		return (fork_error_cleanup(fd));
	if (pid_right == 0)
		exec_right(ast, env, fd);
	close(fd[0]);
	close(fd[1]);
	waitpid(pid_left, NULL, 0);
	waitpid(pid_right, &status, 0);
	ft_interactive_signals();
	return (handle_child_status(status));
}

void	exec_left(t_ast *ast, t_env *env, int *fd)
{
	close(fd[0]);
	if (dup2(fd[1], STDOUT_FILENO) == -1)
		exit (1);
	close(fd[1]);
	ft_restore_signals();
	exit(ft_exec_ast(ast->left, env));
}

void	exec_right(t_ast *ast, t_env *env, int *fd)
{
	close(fd[1]);
	if (dup2(fd[0], STDIN_FILENO) == -1)
		exit (1);
	close(fd[0]);
	ft_restore_signals();
	exit(ft_exec_ast(ast->right, env));
}

int	fork_error_cleanup(int fd[2])
{
	ft_interactive_signals();
	perror("fork");
	close(fd[0]);
	close(fd[1]);
	return (1);
}
